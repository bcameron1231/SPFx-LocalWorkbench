// API Proxy Service
//
// Extension-host service that receives serialized API requests from the webview,
// matches them against mock rules, and returns mock responses.
// Handles loading/watching the mock config file and reading mock body files.

import * as vscode from 'vscode';
import * as path from 'path';
import { MockRuleEngine } from './MockRuleEngine';
import type {
    IMockConfig,
    IMockRule,
    IProxyRequest,
    IProxyResponse,
    IProxySettings
} from './types';

// Default proxy settings when not configured in VS Code settings
const defaultProxySettings: IProxySettings = {
    mockFile: '.spfx-workbench/api-mocks.json',
    defaultDelay: 0,
    fallbackStatus: 404,
    logRequests: true
};

export class ApiProxyService implements vscode.Disposable {
    private readonly _ruleEngine = new MockRuleEngine();
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _outputChannel: vscode.OutputChannel;
    private readonly _workspaceRoot: string;

    private _config: IMockConfig | undefined;
    private _settings: IProxySettings;
    private _configWatcher: vscode.FileSystemWatcher | undefined;

    constructor(workspaceRoot: string) {
        this._workspaceRoot = workspaceRoot;
        this._settings = ApiProxyService.readSettings();
        this._outputChannel = vscode.window.createOutputChannel('SPFx API Proxy');

        // Load initial config
        this._loadConfig();

        // Watch for config file changes
        this._setupConfigWatcher();

        // Watch for settings changes
        this._disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('spfxLocalWorkbench.proxy')) {
                    this._settings = ApiProxyService.readSettings();
                    this._log('Proxy settings updated');
                    // Reload config in case mockFile path changed
                    this._loadConfig();
                }
            })
        );
    }

    // Read proxy settings from VS Code configuration
    static readSettings(): IProxySettings {
        const config = vscode.workspace.getConfiguration('spfxLocalWorkbench.proxy');
        return {
            mockFile: config.get<string>('mockFile', defaultProxySettings.mockFile),
            defaultDelay: config.get<number>('defaultDelay', defaultProxySettings.defaultDelay),
            fallbackStatus: config.get<number>('fallbackStatus', defaultProxySettings.fallbackStatus),
            logRequests: config.get<boolean>('logRequests', defaultProxySettings.logRequests)
        };
    }

    // Handle an API request from the webview.
    // This is the main entry point called by WorkbenchPanel when it receives
    // an 'apiRequest' message.
    async handleRequest(request: IProxyRequest): Promise<IProxyResponse> {
        this._log(`${request.method} ${request.url} [${request.clientType}]`);

        try {
            const rule = this._ruleEngine.match(request);

            if (rule) {
                this._log(`  Matched rule: ${rule.match.url}`);
                return await this._respondFromRule(request, rule);
            }

            // No matching rule
            this._log(`  No match - fallback ${this._settings.fallbackStatus}`);
            return this._fallbackResponse(request);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            this._log(`  Error: ${message}`);
            return {
                id: request.id,
                status: 500,
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ error: message }),
                matched: false
            };
        }
    }

    // ── Config Loading ──────────────────────────────────────────────

    private async _loadConfig(): Promise<void> {
        const configPath = path.join(this._workspaceRoot, this._settings.mockFile);

        try {
            const uri = vscode.Uri.file(configPath);
            const raw = await vscode.workspace.fs.readFile(uri);
            const text = Buffer.from(raw).toString('utf-8');
            this._config = JSON.parse(text) as IMockConfig;
            this._ruleEngine.setRules(this._config.rules || []);
            this._log(`Loaded ${this._config.rules?.length ?? 0} mock rules from ${this._settings.mockFile}`);
        } catch {
            // Config file doesn't exist yet — that's fine
            this._config = undefined;
            this._ruleEngine.setRules([]);
            this._log(`No mock config found at ${this._settings.mockFile} (using defaults)`);
        }
    }

    private _setupConfigWatcher(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }

        // Watch the mock config file and all files in the mocks directory
        const configPattern = new vscode.RelativePattern(workspaceFolder, this._settings.mockFile);
        this._configWatcher = vscode.workspace.createFileSystemWatcher(configPattern);

        const onChange = () => {
            this._log('Mock config changed, reloading...');
            this._loadConfig();
        };

        this._configWatcher.onDidChange(onChange);
        this._configWatcher.onDidCreate(onChange);
        this._configWatcher.onDidDelete(() => {
            this._config = undefined;
            this._ruleEngine.setRules([]);
            this._log('Mock config deleted');
        });

        this._disposables.push(this._configWatcher);
    }

    // ── Response Builders ───────────────────────────────────────────

    // Build a response from a matched mock rule
    private async _respondFromRule(request: IProxyRequest, rule: IMockRule): Promise<IProxyResponse> {
        // Determine delay
        const delay = rule.response.delay ?? this._config?.delay ?? this._settings.defaultDelay;
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Read body from file or use inline body
        let body: string;
        if (rule.response.bodyFile) {
            const filePath = path.join(this._workspaceRoot, rule.response.bodyFile);
            try {
                const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
                body = Buffer.from(raw).toString('utf-8');
            } catch {
                this._log(`  Warning: Could not read body file: ${rule.response.bodyFile}`);
                body = JSON.stringify({ error: `Mock body file not found: ${rule.response.bodyFile}` });
            }
        } else if (rule.response.body !== undefined) {
            body = typeof rule.response.body === 'string'
                ? rule.response.body
                : JSON.stringify(rule.response.body);
        } else {
            body = '{}';
        }

        return {
            id: request.id,
            status: rule.response.status,
            headers: rule.response.headers ?? { 'content-type': 'application/json' },
            body,
            matched: true
        };
    }

    // Return a fallback response when no rule matches
    private _fallbackResponse(request: IProxyRequest): IProxyResponse {
        return {
            id: request.id,
            status: this._settings.fallbackStatus,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                error: 'No mock rule matched',
                url: request.url,
                method: request.method,
                clientType: request.clientType
            }),
            matched: false
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private _log(message: string): void {
        if (this._settings.logRequests) {
            const timestamp = new Date().toISOString().substring(11, 23);
            this._outputChannel.appendLine(`[${timestamp}] ${message}`);
        }
    }

    // Initialize the scaffold files if they don't exist
    async scaffoldMockConfig(): Promise<void> {
        const configPath = path.join(this._workspaceRoot, this._settings.mockFile);

        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(configPath));
            // File already exists
            return;
        } catch {
            // File doesn't exist — create scaffold
        }

        const scaffold: IMockConfig = {
            delay: 0,
            rules: [
                {
                    match: {
                        url: '/_api/web/lists',
                        method: 'GET'
                    },
                    response: {
                        status: 200,
                        headers: { 'content-type': 'application/json;odata=verbose' },
                        body: {
                            d: {
                                results: [
                                    { Title: 'Documents', Id: '1', ItemCount: 5 },
                                    { Title: 'Site Pages', Id: '2', ItemCount: 3 }
                                ]
                            }
                        }
                    }
                }
            ]
        };

        const configDir = path.dirname(configPath);
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(configDir));
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(configPath),
            Buffer.from(JSON.stringify(scaffold, null, 2), 'utf-8')
        );

        this._log(`Scaffolded mock config at ${this._settings.mockFile}`);
        await this._loadConfig();
    }

    dispose(): void {
        this._outputChannel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
    }
}
