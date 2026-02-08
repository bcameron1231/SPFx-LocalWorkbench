// Workbench Panel
// 
// This is the main panel class that manages the SPFx Local Workbench webview.
// It handles the lifecycle of the webview and communication between the
// extension and the webview.

import * as vscode from 'vscode';
import { SpfxProjectDetector, IWebPartManifest } from './SpfxProjectDetector';
import { generateWorkbenchHtml, generateErrorHtml } from './html';
import { getWorkbenchSettings, onConfigurationChanged, IWorkbenchSettings } from './config';

// Generates a cryptographic nonce for CSP
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// WorkbenchPanel manages the webview that hosts the SPFx local workbench.
export class WorkbenchPanel {
    public static currentPanel: WorkbenchPanel | undefined;
    private static readonly viewType = 'spfxWorkbench';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _webParts: IWebPartManifest[] = [];
    private _extensions: IWebPartManifest[] = [];
    private _settings: IWorkbenchSettings;
    private _liveReloadDebounceTimer: ReturnType<typeof setTimeout> | undefined;

    // Creates or reveals the workbench panel
    public static createOrShow(extensionUri: vscode.Uri): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (WorkbenchPanel.currentPanel) {
            WorkbenchPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            WorkbenchPanel.viewType,
            'SPFx Local Workbench',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'dist')
                ]
            }
        );

        WorkbenchPanel.currentPanel = new WorkbenchPanel(panel, extensionUri);
    }

    // Revives the panel from a previous session
    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri): void {
        WorkbenchPanel.currentPanel = new WorkbenchPanel(panel, extensionUri);
    }    /**
     * Private constructor - use createOrShow() instead
     */
    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._settings = getWorkbenchSettings();

        // Set initial content
        this._update();

        // Handle panel disposal
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Note: retainContextWhenHidden is enabled so re-setting HTML on
        // visibility change would destroy all webview state (active web parts,
        // React tree, loaded bundles).  Only set HTML once during construction.

        // Listen for configuration changes
        this._disposables.push(
            onConfigurationChanged((newSettings) => {
                this._settings = newSettings;
                this._update();
            })
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                await this._handleMessage(message);
            },
            null,
            this._disposables
        );

        // Watch for bundle changes (live reload)
        this._setupLiveReloadWatcher();

        // Load web parts
        this._loadWebParts();
    }

    // Handles messages from the webview
    private async _handleMessage(message: { command: string; url?: string; text?: string }): Promise<void> {
        switch (message.command) {
            case 'refresh':
                await this._loadWebParts();
                this._update();
                return;

            case 'openDevTools':
                vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools');
                return;

            case 'log':
                return;

            case 'error':
                console.error('Workbench - ' + message.text);
                if (message.text) {
                    vscode.window.showErrorMessage(message.text);
                }
                return;
        }
    }

    // Loads web part manifests from the current workspace
    private async _loadWebParts(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showWarningMessage('No workspace folder open');
            return;
        }

        const detector = new SpfxProjectDetector(workspaceFolder.uri.fsPath);
        const isSpfx = await detector.isSpfxProject();

        if (!isSpfx) {
            vscode.window.showWarningMessage('This does not appear to be an SPFx project.');
            return;
        }

        this._webParts = await detector.getWebPartManifests();
        this._extensions = await detector.getExtensionManifests();

        if (this._webParts.length === 0 && this._extensions.length === 0) {
            vscode.window.showWarningMessage('No web parts or extensions found in this SPFx project.');
        }
    }

    // Sets up a file system watcher on the SPFx dist/ folder for live reload
    private _setupLiveReloadWatcher(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }

        // Watch for compiled bundle changes in dist/ (heft start output)
        const distPattern = new vscode.RelativePattern(workspaceFolder, 'dist/*.js');
        const distWatcher = vscode.workspace.createFileSystemWatcher(distPattern);

        const onBundleChanged = () => {
            // Debounce: heft may write multiple files in quick succession
            if (this._liveReloadDebounceTimer) {
                clearTimeout(this._liveReloadDebounceTimer);
            }
            this._liveReloadDebounceTimer = setTimeout(() => {
                this._panel.webview.postMessage({ command: 'liveReload' });
            }, 500);
        };

        distWatcher.onDidChange(onBundleChanged);
        distWatcher.onDidCreate(onBundleChanged);
        this._disposables.push(distWatcher);
    }

    // Disposes the panel and all resources
    public dispose(): void {
        WorkbenchPanel.currentPanel = undefined;

        if (this._liveReloadDebounceTimer) {
            clearTimeout(this._liveReloadDebounceTimer);
        }

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    // Updates the webview content
    private _update(): void {
        const webview = this._panel.webview;
        this._panel.title = 'SPFx Local Workbench';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }    /**
     * Generates the HTML content for the webview
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();
        const webPartsJson = JSON.stringify(this._webParts);
        const extensionsJson = JSON.stringify(this._extensions);

        return generateWorkbenchHtml({
            nonce,
            serveUrl: this._settings.serveUrl,
            webPartsJson,
            extensionsJson,
            cspSource: webview.cspSource,
            webPartCount: this._webParts.length,
            extensionCount: this._extensions.length,
            webview: webview,
            extensionUri: this._extensionUri,
            themeSettings: this._settings.theme,
            contextSettings: this._settings.context,
            pageContextSettings: this._settings.pageContext
        });
    }
}
