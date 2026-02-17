import * as vscode from 'vscode';

import { escapeHtml, getErrorMessage } from '@spfx-local-workbench/shared';
import { getNonce } from '@spfx-local-workbench/shared/utils/securityUtils';

import { SpfxProjectDetector } from '../SpfxProjectDetector';
import { IStorybookServerOptions, StorybookServerManager } from './StorybookServerManager';

/**
 * Manages the Storybook webview panel
 */
export class StorybookPanel {
  public static currentPanel: StorybookPanel | undefined;
  private static readonly viewType = 'spfxStorybook';

  private readonly panel: vscode.WebviewPanel;
  private readonly serverManager: StorybookServerManager;
  private disposables: vscode.Disposable[] = [];
  private currentStatusTitle: string = 'Starting Storybook...';
  private currentStatusMessage: string = 'Initializing';

  /**
   * Create or show the Storybook panel
   */
  public static async createOrShow(
    extensionUri: vscode.Uri,
    detector: SpfxProjectDetector,
    options?: IStorybookServerOptions,
  ): Promise<StorybookPanel> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (StorybookPanel.currentPanel) {
      StorybookPanel.currentPanel.panel.reveal(column);
      // Restart server with new options if provided
      if (options) {
        await StorybookPanel.currentPanel.serverManager.restart(options);
        StorybookPanel.currentPanel.refresh();
      }
      return StorybookPanel.currentPanel;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      StorybookPanel.viewType,
      'SPFx Storybook',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      },
    );

    panel.iconPath = {
      light: vscode.Uri.joinPath(extensionUri, 'media', 'icon.png'),
      dark: vscode.Uri.joinPath(extensionUri, 'media', 'icon.png'),
    };

    StorybookPanel.currentPanel = new StorybookPanel(panel, extensionUri, detector, options);
    return StorybookPanel.currentPanel;
  }

  /**
   * Revive panel from serialized state
   */
  public static async revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    detector: SpfxProjectDetector,
  ): Promise<void> {
    StorybookPanel.currentPanel = new StorybookPanel(panel, extensionUri, detector);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    detector: SpfxProjectDetector,
    options?: IStorybookServerOptions,
  ) {
    this.panel = panel;

    // Create server manager
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder found');
    }

    this.serverManager = new StorybookServerManager(
      workspaceFolder.uri.fsPath,
      detector,
      extensionUri,
      undefined,
      (title: string, message: string) => this.updateStatus(title, message),
    );

    // Set context for menu visibility
    void vscode.commands.executeCommand('setContext', 'spfxLocalWorkbench.isStorybook', true);

    // Set the webview's initial html content
    this.panel.webview.html = this.getLoadingHtml();

    // Start the server and update content when ready
    this.startServer(options);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'refresh':
            this.refresh();
            break;
          case 'restart':
            this.restart();
            break;
        }
      },
      null,
      this.disposables,
    );

    // Handle panel disposal
    this.panel.onDidDispose(() => void this.dispose(), null, this.disposables);

    // Handle visibility changes
    this.panel.onDidChangeViewState(
      () => {
        void vscode.commands.executeCommand(
          'setContext',
          'spfxLocalWorkbench.isStorybook',
          this.panel.active,
        );
      },
      null,
      this.disposables,
    );
  }

  /**
   * Update the status display
   */
  private updateStatus(title: string, message: string): void {
    this.currentStatusTitle = title;
    this.currentStatusMessage = message;
    // Update the HTML if we're in loading state
    if (!this.serverManager.isRunning()) {
      this.panel.webview.html = this.getLoadingHtml();
    }
  }

  /**
   * Start the Storybook server
   */
  private async startServer(options?: IStorybookServerOptions): Promise<void> {
    try {
      await this.serverManager.start(options);
      this.panel.webview.html = this.getStorybookHtml();
    } catch (error: unknown) {
      this.panel.webview.html = this.getErrorHtml(getErrorMessage(error));
    }
  }

  /**
   * Refresh the Storybook iframe
   */
  public refresh(): void {
    if (this.serverManager.isRunning()) {
      this.panel.webview.html = this.getStorybookHtml();
    }
  }

  /**
   * Restart the Storybook server
   */
  public async restart(): Promise<void> {
    this.currentStatusTitle = 'Restarting Storybook...';
    this.currentStatusMessage = 'Initializing';
    this.panel.webview.html = this.getLoadingHtml();
    try {
      await this.serverManager.restart();
      this.panel.webview.html = this.getStorybookHtml();
    } catch (error: unknown) {
      this.panel.webview.html = this.getErrorHtml(getErrorMessage(error));
    }
  }

  /**
   * Dispose of the panel and server
   */
  public async dispose(): Promise<void> {
    StorybookPanel.currentPanel = undefined;

    // Clear context
    void vscode.commands.executeCommand('setContext', 'spfxLocalWorkbench.isStorybook', false);

    // Stop and dispose the server (this now handles cleanup properly)
    await this.serverManager.dispose();

    // Clean up resources
    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Get the HTML for the loading state
   */
  private getLoadingHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPFx Storybook</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .loading {
            text-align: center;
        }
        .spinner {
            border: 4px solid var(--vscode-editorWidget-border);
            border-top: 4px solid var(--vscode-progressBar-background);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h2 {
            margin: 0 0 10px;
            font-size: 18px;
            font-weight: 600;
        }
        p {
            margin: 0;
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <h2>${escapeHtml(this.currentStatusTitle)}</h2>
        <p>${escapeHtml(this.currentStatusMessage)}</p>
    </div>
</body>
</html>`;
  }

  /**
   * Get the HTML for displaying Storybook in an iframe
   */
  private getStorybookHtml(): string {
    const storybookUrl = this.serverManager.getUrl();
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none'; 
                   frame-src ${storybookUrl} http://localhost:* ws://localhost:*; 
                   script-src 'nonce-${nonce}'; 
                   style-src 'unsafe-inline';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPFx Storybook</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: var(--vscode-editor-background);
        }
        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background-color: var(--vscode-editorWidget-background);
            border-bottom: 1px solid var(--vscode-editorWidget-border);
        }
        .toolbar-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .toolbar-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--vscode-editor-foreground);
        }
        .toolbar-url {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            font-family: 'Courier New', monospace;
        }
        .toolbar-actions {
            display: flex;
            gap: 8px;
        }
        button {
            padding: 4px 12px;
            font-size: 12px;
            border: 1px solid var(--vscode-button-border);
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            border-radius: 2px;
        }
        button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        iframe {
            width: 100%;
            height: calc(100vh - 41px);
            border: none;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="toolbar-left">
            <span class="toolbar-title">SPFx Storybook</span>
            <span class="toolbar-url">${storybookUrl}</span>
        </div>
        <div class="toolbar-actions">
            <button onclick="refresh()">↻ Refresh</button>
            <button onclick="restart()">⟳ Restart</button>
        </div>
    </div>
    <iframe src="${storybookUrl}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>
    
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        function refresh() {
            vscode.postMessage({ type: 'refresh' });
        }
        
        function restart() {
            vscode.postMessage({ type: 'restart' });
        }
    </script>
</body>
</html>`;
  }

  /**
   * Get the HTML for displaying an error
   */
  private getErrorHtml(error: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPFx Storybook - Error</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .error {
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            border-radius: 4px;
        }
        h2 {
            margin: 0 0 12px;
            font-size: 18px;
            font-weight: 600;
            color: var(--vscode-errorForeground);
        }
        pre {
            margin: 12px 0 0;
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
        }
        p {
            margin: 8px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="error">
        <h2>Failed to Start Storybook</h2>
        <p>An error occurred while starting the Storybook server:</p>
        <pre>${escapeHtml(error)}</pre>
        <p>Please check the output panel for more details.</p>
    </div>
</body>
</html>`;
  }
}

/**
 * Serializer for restoring Storybook panels on reload
 */
export class StorybookPanelSerializer implements vscode.WebviewPanelSerializer {
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly getDetector: () => SpfxProjectDetector | undefined,
  ) {}

  async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: unknown): Promise<void> {
    const detector = this.getDetector();
    if (!detector) {
      webviewPanel.dispose();
      return;
    }

    await StorybookPanel.revive(webviewPanel, this.extensionUri, detector);
  }
}
