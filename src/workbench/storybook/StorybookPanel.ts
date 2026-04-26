import * as vscode from 'vscode';

import { escapeHtml, getErrorMessage } from '@spfx-local-workbench/shared';

import { SpfxProjectDetector } from '../SpfxProjectDetector';
import type { IStorybookThemeColors } from '../types';
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
    extensionMode: vscode.ExtensionMode,
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

    panel.iconPath = new vscode.ThemeIcon('fluentui-teststep');

    StorybookPanel.currentPanel = new StorybookPanel(
      panel,
      extensionUri,
      extensionMode,
      detector,
      options,
    );
    return StorybookPanel.currentPanel;
  }

  /**
   * Revive panel from serialized state
   */
  public static async revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    extensionMode: vscode.ExtensionMode,
    detector: SpfxProjectDetector,
  ): Promise<void> {
    StorybookPanel.currentPanel = new StorybookPanel(panel, extensionUri, extensionMode, detector);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    extensionMode: vscode.ExtensionMode,
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
      extensionMode,
      undefined,
      (title: string, message: string) => this.updateStatus(title, message),
    );

    // Set context for menu visibility
    void vscode.commands.executeCommand('setContext', 'spfxLocalWorkbench.isStorybook', true);

    // Set the webview's initial html content
    this.panel.webview.html = this.getLoadingHtml();

    // Start the server and update content when ready
    this.startServer(options);

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

    // Handle clipboard requests from Storybook — Storybook intercepts CMD+V/CTRL+V in the
    // cross-origin iframe (where VS Code keybindings never fire) and relays the request
    // here. The extension reads the clipboard via the VS Code API and sends the text back.
    // Also handles clipboard writes (copy/cut) and contextCmd routing.
    this.panel.webview.onDidReceiveMessage(
      async (message: { type?: string; target?: string; text?: string }) => {
        if (message.type === 'spfx:clipboardRequest') {
          const text = await vscode.env.clipboard.readText();
          void this.panel.webview.postMessage({ type: 'spfx:paste', text, target: message.target });
        } else if (message.type === 'spfx:clipboardWrite' && message.text !== undefined) {
          await vscode.env.clipboard.writeText(message.text);
        }
      },
      undefined,
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
    const themeSetting = vscode.workspace
      .getConfiguration('spfxLocalWorkbench.storybook')
      .get<string>('theme', 'matchVsCode');

    // When theme is forced to light or dark, skip CSS var extraction entirely.
    // The manager will write { base: 'light' } / { base: 'dark' } to theme.json directly.
    // peacock still needs the base VS Code CSS vars for non-accent fields.
    let themeColors: IStorybookThemeColors | undefined;

    if (themeSetting === 'matchVsCode' || themeSetting === 'peacock') {
      // Capture VS Code theme colors from the loading HTML before starting the server.
      // The loading HTML script posts --vscode-* CSS var values back to us.
      // We race against a 1s timeout so a slow or missing message never blocks startup.
      themeColors = await new Promise<IStorybookThemeColors | undefined>((resolve) => {
        const timer = setTimeout(() => {
          sub.dispose();
          resolve(undefined);
        }, 1000);

        const sub = this.panel.webview.onDidReceiveMessage(
          (msg: { command: string; colors?: IStorybookThemeColors }) => {
            if (msg.command === 'vscodeThemeColors' && msg.colors) {
              clearTimeout(timer);
              sub.dispose();
              resolve(msg.colors);
            }
          },
        );
      });
    }

    try {
      await this.serverManager.start(options, themeColors);
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
    await this.serverManager.stop();
    // Route through startServer() so theme colors are re-extracted (or the
    // forced light/dark setting is respected) on every restart.
    await this.startServer();
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
    <script>
      (function () {
        const vscodeApi = acquireVsCodeApi();
        const s = getComputedStyle(document.body);
        const get = function (v) { return s.getPropertyValue(v).trim() || ''; };
        const isDark = document.body.classList.contains('vscode-dark') ||
                       document.body.classList.contains('vscode-high-contrast');
        vscodeApi.postMessage({
          command: 'vscodeThemeColors',
          colors: {
            base:              isDark ? 'dark' : 'light',
            // colorSecondary is the sidebar selected-story row fill; button-background gives the vivid accent.
            // colorPrimary is used for smaller accent elements (icons, focus rings, active marks).
            colorPrimary:      get('--vscode-focusBorder'),
            colorSecondary:    get('--vscode-button-background'),
            appBg:             get('--vscode-sideBar-background'),
            appContentBg:      get('--vscode-editor-background'),
            appBorderColor:    get('--vscode-panel-border'),
            fontCode:          get('--vscode-editor-font-family'),
            textColor:         get('--vscode-foreground'),
            // textInverseColor renders on top of colorPrimary fills — use button-foreground which is
            // guaranteed to contrast against button-background; focusBorder is similar enough in practice.
            textInverseColor:  get('--vscode-button-foreground'),
            textMutedColor:    get('--vscode-descriptionForeground'),
            barBg:             get('--vscode-editorGroupHeader-tabsBackground'),
            barTextColor:      get('--vscode-tab-inactiveForeground'),
            barSelectedColor:  get('--vscode-tab-activeForeground'),
            barHoverColor:     get('--vscode-list-hoverForeground') || get('--vscode-foreground'),
            buttonBg:          get('--vscode-inputOption-activeBackground'),
            buttonBorder:      get('--vscode-button-border') || get('--vscode-button-background'),
            booleanBg:         get('--vscode-settings-checkboxBackground') || get('--vscode-input-background'),
            booleanSelectedBg: get('--vscode-inputOption-activeBackground') || get('--vscode-button-background'),
            inputBg:           get('--vscode-input-background'),
            inputBorder:       get('--vscode-input-border') || get('--vscode-panel-border'),
            inputTextColor:    get('--vscode-input-foreground'),
          }
        });
      }());
    </script>
</body>
</html>`;
  }

  /**
   * Get the HTML for displaying Storybook in an iframe
   */
  private getStorybookHtml(): string {
    const storybookUrl = this.serverManager.getUrl();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none'; 
                   frame-src ${storybookUrl} http://localhost:* ws://localhost:*; 
                   style-src 'unsafe-inline';
                   script-src 'unsafe-inline';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPFx Storybook</title>
    <style>
        body { margin: 0; padding: 0; overflow: hidden; background-color: var(--vscode-editor-background); }
        iframe { width: 100%; height: 100vh; border: none; }
        #spfx-cm {
            display: none; position: fixed; z-index: 9999;
            background: var(--vscode-menu-background, #252526);
            border: 1px solid var(--vscode-menu-border, #3c3c3c);
            border-radius: 4px; padding: 4px 0; min-width: 200px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4); user-select: none;
        }
        .cm-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 5px 12px; font-size: 13px;
            font-family: var(--vscode-font-family, -apple-system, sans-serif);
            color: var(--vscode-menu-foreground, #cccccc);
            cursor: pointer; white-space: nowrap; gap: 24px;
        }
        .cm-item:hover { background: var(--vscode-list-hoverBackground, #2a2d2e); }
        .cm-item.disabled { opacity: 0.4; pointer-events: none; }
        .cm-hint { color: var(--vscode-descriptionForeground, #858585); font-size: 12px; }
        .cm-sep { height: 1px; background: var(--vscode-menu-separatorBackground, #3c3c3c); margin: 4px 0; }
        /* Transparent full-screen backdrop. Sits above the iframe (pointer-events
           would otherwise never reach the outer document from a cross-origin iframe)
           but below the menu so item clicks still work. Shown only while menu is open. */
        #spfx-cm-backdrop {
            display: none; position: fixed; inset: 0; z-index: 9998;
        }
    </style>
</head>
<body>
    <iframe id="storybook-frame" src="${storybookUrl}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>
    <div id="spfx-cm-backdrop"></div>
    <div id="spfx-cm" role="menu">
      <div class="cm-item" id="cm-undo">      <span>Undo</span>       <span class="cm-hint" id="hint-undo"></span></div>
      <div class="cm-item" id="cm-redo">      <span>Redo</span>       <span class="cm-hint" id="hint-redo"></span></div>
      <div class="cm-sep"></div>
      <div class="cm-item" id="cm-cut">       <span>Cut</span>        <span class="cm-hint" id="hint-cut"></span></div>
      <div class="cm-item" id="cm-copy">      <span>Copy</span>       <span class="cm-hint" id="hint-copy"></span></div>
      <div class="cm-item" id="cm-paste">     <span>Paste</span>      <span class="cm-hint" id="hint-paste"></span></div>
      <div class="cm-item" id="cm-select-all"><span>Select All</span> <span class="cm-hint" id="hint-select-all"></span></div>
    </div>
    <script>
      var vscode = acquireVsCodeApi();
      var frame = document.getElementById('storybook-frame');
      var cm = document.getElementById('spfx-cm');
      var backdrop = document.getElementById('spfx-cm-backdrop');
      var cmTarget = 'manager';

      // Detect platform to show the correct keyboard shortcut hints.
      var isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);
      var mod = isMac ? '⌘ ' : 'Ctrl+';
      document.getElementById('hint-undo').textContent       = mod + 'Z';
      document.getElementById('hint-redo').textContent       = isMac ? '⇧ ⌘ Z' : 'Ctrl+Y';
      document.getElementById('hint-cut').textContent        = mod + 'X';
      document.getElementById('hint-copy').textContent       = mod + 'C';
      document.getElementById('hint-paste').textContent      = mod + 'V';
      document.getElementById('hint-select-all').textContent = mod + 'A';

      function hideMenu() {
        cm.style.display = 'none';
        backdrop.style.display = 'none';
      }

      function showMenu(x, y, target, hasSelection, isEditable) {
        cmTarget = target;
        document.getElementById('cm-cut').classList.toggle('disabled', !hasSelection || !isEditable);
        document.getElementById('cm-copy').classList.toggle('disabled', !hasSelection);
        document.getElementById('cm-undo').classList.toggle('disabled', !isEditable);
        document.getElementById('cm-redo').classList.toggle('disabled', !isEditable);
        document.getElementById('cm-select-all').classList.toggle('disabled', !isEditable);
        // Show backdrop first so any click (including inside the iframe) is captured.
        backdrop.style.display = 'block';
        cm.style.left = '0'; cm.style.top = '0'; cm.style.display = 'block';
        // Clamp to viewport after measuring actual size.
        requestAnimationFrame(function() {
          cm.style.left = Math.min(x, window.innerWidth  - cm.offsetWidth  - 4) + 'px';
          cm.style.top  = Math.min(y, window.innerHeight - cm.offsetHeight - 4) + 'px';
        });
      }

      // The backdrop covers the entire viewport (including the iframe) and dismisses
      // the menu on any click that doesn't land on a menu item.
      backdrop.addEventListener('mousedown', hideMenu);
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { hideMenu(); }
      });

      function cmAction(cmd) {
        // All context menu actions (including paste) go through spfx:contextCmd so the
        // iframe can restore focus to the saved element before the async clipboard
        // round-trip begins. Paste is no longer sent directly to the extension here.
        frame.contentWindow.postMessage({ type: 'spfx:contextCmd', cmd: cmd, target: cmTarget }, '*');
        hideMenu();
      }

      document.getElementById('cm-cut').onclick        = function() { cmAction('cut'); };
      document.getElementById('cm-copy').onclick       = function() { cmAction('copy'); };
      document.getElementById('cm-paste').onclick      = function() { cmAction('paste'); };
      document.getElementById('cm-undo').onclick       = function() { cmAction('undo'); };
      document.getElementById('cm-redo').onclick       = function() { cmAction('redo'); };
      document.getElementById('cm-select-all').onclick = function() { cmAction('selectAll'); };

      window.addEventListener('message', function(e) {
        var data = e.data;
        if (!data || typeof data !== 'object') { return; }
        // Only trust iframe-originated message types when they actually come from the frame.
        // Extension-originated types (spfx:paste, spfx:selectAll) skip this check.
        var fromFrame = e.source === frame.contentWindow;
        if (data.type === 'spfx:clipboardRequest') {
          if (!fromFrame) { return; }
          vscode.postMessage({ type: 'spfx:clipboardRequest', target: data.target });
        } else if (data.type === 'spfx:clipboardWrite') {
          if (!fromFrame) { return; }
          vscode.postMessage({ type: 'spfx:clipboardWrite', text: data.text });
        } else if (data.type === 'spfx:contextMenu') {
          if (!fromFrame) { return; }
          showMenu(data.x, data.y, data.target, data.hasSelection, data.isEditable);
        } else if (data.type === 'spfx:paste' || data.type === 'spfx:selectAll') {
          frame.contentWindow.postMessage(data, '*');
        }
      });
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
    private readonly extensionMode: vscode.ExtensionMode,
    private readonly getDetector: () => SpfxProjectDetector | undefined,
  ) {}

  async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: unknown): Promise<void> {
    const detector = this.getDetector();
    if (!detector) {
      webviewPanel.dispose();
      return;
    }

    await StorybookPanel.revive(webviewPanel, this.extensionUri, this.extensionMode, detector);
  }
}
