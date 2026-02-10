// Workbench Panel
// 
// This is the main panel class that manages the SPFx Local Workbench webview.
// It handles the lifecycle of the webview and communication between the
// extension and the webview.

import * as vscode from 'vscode';
import { randomBytes } from 'crypto';
import { SpfxProjectDetector } from './SpfxProjectDetector';
import type { IWebPartManifest } from './types';
import { generateWorkbenchHtml, generateErrorHtml } from './html';
import { getWorkbenchSettings, onConfigurationChanged, IWorkbenchSettings } from './config';

// Generates a cryptographic nonce for CSP
function getNonce(): string {
    return randomBytes(16).toString('base64url');
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

        panel.iconPath = {
            light: vscode.Uri.joinPath(extensionUri, 'media', 'workbench-light.svg'),
            dark: vscode.Uri.joinPath(extensionUri, 'media', 'workbench-dark.svg'),
        };


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
        void vscode.commands.executeCommand('setContext', 'spfxLocalWorkbench.isWorkbench', true);

        // Set initial content
        this._update();

        // Handle panel disposal
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.onDidChangeViewState(
            () => {
                void vscode.commands.executeCommand('setContext', 'spfxLocalWorkbench.isWorkbench', this._panel.active);
            },
            null,
            this._disposables
        );

        // Note: retainContextWhenHidden is enabled so re-setting HTML on
        // visibility change would destroy all webview state (active web parts,
        // React tree, loaded bundles).  Only set HTML once during construction.

        // Listen for configuration changes — post a message to the webview
        // instead of re-setting HTML which would destroy all webview state
        this._disposables.push(
            onConfigurationChanged((newSettings) => {
                this._settings = newSettings;
                this._panel.webview.postMessage({
                    command: 'settingsChanged',
                    settings: {
                        serveUrl: newSettings.serveUrl,
                        theme: newSettings.theme,
                        context: newSettings.context,
                        pageContext: newSettings.pageContext
                    }
                });
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

    // Reloads manifests and updates the webview (called by manifest file watcher)
    public async refreshManifests(): Promise<void> {
        await this._loadWebParts();
        this._update();
    }

    // Disposes the panel and all resources
    public dispose(): void {
        WorkbenchPanel.currentPanel = undefined;
        void vscode.commands.executeCommand('setContext', 'spfxLocalWorkbench.isWorkbench', false);

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

    // Sends a message to the webview
    public postMessage(message: { command: string; [key: string]: any }): void {
        void this._panel.webview.postMessage(message);
    }
}
