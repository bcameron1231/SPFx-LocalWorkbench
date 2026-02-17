import * as path from 'path';
import * as vscode from 'vscode';

import { DEFAULT_SPFX_SERVE_PORT } from '@spfx-local-workbench/shared';
import {
  getErrorMessage,
  isFileNotFoundError,
} from '@spfx-local-workbench/shared/utils/errorUtils';
import { logger } from '@spfx-local-workbench/shared/utils/logger';
import { isPortReachable } from '@spfx-local-workbench/shared/utils/networkUtils';

import {
  SpfxProjectDetector,
  StoryGenerator,
  StorybookPanel,
  StorybookPanelSerializer,
  WorkbenchPanel,
  createManifestWatcher,
  getWorkbenchSettings,
} from './workbench';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const log = logger.createChild('Extension');

  // Shared detector instance — workspace path rarely changes
  let detector: SpfxProjectDetector | undefined;
  function getDetector(): SpfxProjectDetector | undefined {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return undefined;
    }
    if (!detector || detector.workspacePath !== workspaceFolder.uri.fsPath) {
      detector = new SpfxProjectDetector(workspaceFolder.uri.fsPath);
    }
    return detector;
  }

  // Helper function to start serve if needed and wait for it to be ready
  async function startServeIfNeeded(): Promise<boolean> {
    const det = getDetector();
    if (!det) {
      vscode.window.showErrorMessage('No workspace folder open');
      return false;
    }

    const isSpfx = await det.isSpfxProject();
    if (!isSpfx) {
      vscode.window.showErrorMessage('This does not appear to be an SPFx project');
      return false;
    }

    // Get the SPFx project's serve configuration
    const serveConfig = await det.getServeConfig();
    const serveHost = 'localhost';
    const servePort = serveConfig.port || DEFAULT_SPFX_SERVE_PORT;

    // Check if serve is already running
    const alreadyRunning = await isPortReachable(serveHost, servePort);
    if (alreadyRunning) {
      return true;
    }

    // Get workbench settings for the serve command
    const settings = getWorkbenchSettings();

    // Create a terminal and run the configured serve command
    const terminal = vscode.window.createTerminal('SPFx Serve');
    terminal.show();
    terminal.sendText(settings.serveCommand);

    // Wait for the serve port to accept connections, with a progress indicator
    const serverReady = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'SPFx Serve',
        cancellable: true,
      },
      async (progress, cancellationToken) => {
        const maxWaitMs = 120_000; // 2 minutes
        const pollIntervalMs = 500;
        const startTime = Date.now();

        progress.report({ message: 'Waiting for serve to start…' });

        while (Date.now() - startTime < maxWaitMs) {
          if (cancellationToken.isCancellationRequested) {
            return false;
          }

          if (await isPortReachable(serveHost, servePort)) {
            return true;
          }

          const elapsed = Math.round((Date.now() - startTime) / 1000);
          progress.report({ message: `Waiting for serve to start… (${elapsed}s)` });
          await delay(pollIntervalMs);
        }

        return false; // timed out
      },
    );

    if (!serverReady) {
      const choice = await vscode.window.showWarningMessage(
        'SPFx serve did not start in time. Continue anyway?',
        'Continue',
        'Cancel',
      );
      return choice === 'Continue';
    }

    return true;
  }

  // Register serializers to restore webviews on reload
  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer(
      'spfxLocalWorkbench',
      new WorkbenchPanelSerializer(context.extensionUri, getDetector),
    ),
    vscode.window.registerWebviewPanelSerializer(
      'spfxStorybook',
      new StorybookPanelSerializer(context.extensionUri, getDetector),
    ),
  );

  // Register the Open Workbench command
  const openWorkbenchCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.openWorkbench',
    () => {
      WorkbenchPanel.createOrShow(context.extensionUri);
    },
  );

  // Register the Start Serve command
  const startServeWorkbenchCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.startServeWorkbench',
    async () => {
      const ready = await startServeIfNeeded();
      if (ready) {
        WorkbenchPanel.createOrShow(context.extensionUri);
      }
    },
  );

  // Register the Detect Web Parts command
  const detectWebPartsCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.detectWebParts',
    async () => {
      if (WorkbenchPanel.currentPanel) {
        WorkbenchPanel.currentPanel.postMessage({ command: 'refresh' });
        return;
      }

      const det = getDetector();
      if (!det) {
        vscode.window.showWarningMessage('No workspace folder open');
        return;
      }

      const manifests = await det.getWebPartManifests();

      if (manifests.length === 0) {
        vscode.window.showInformationMessage('No web parts found in this project');
      } else {
        const webPartNames = manifests.map((m) => m.alias || m.id).join(', ');
        vscode.window.showInformationMessage(
          `Found ${manifests.length} web part(s): ${webPartNames}`,
        );
      }
    },
  );

  const openDevToolsCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.openDevTools',
    () => {
      vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools');
    },
  );

  // Register the Open Storybook command
  const openStorybookCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.openStorybook',
    async () => {
      const det = getDetector();
      if (!det) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const isSpfx = await det.isSpfxProject();
      if (!isSpfx) {
        vscode.window.showErrorMessage('This does not appear to be an SPFx project');
        return;
      }

      await StorybookPanel.createOrShow(context.extensionUri, det);
    },
  );

  // Register the Start Serve & Open Storybook command
  const startServeStorybookCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.startServeStorybook',
    async () => {
      const ready = await startServeIfNeeded();
      if (ready) {
        const det = getDetector();
        if (det) {
          await StorybookPanel.createOrShow(context.extensionUri, det);
        }
      }
    },
  );

  // Register the Generate Stories command
  const generateStoriesCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.generateStories',
    async () => {
      const det = getDetector();
      if (!det) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const isSpfx = await det.isSpfxProject();
      if (!isSpfx) {
        vscode.window.showErrorMessage('This does not appear to be an SPFx project');
        return;
      }

      try {
        // Read storybook configuration from VS Code settings
        const config = vscode.workspace.getConfiguration('spfxLocalWorkbench.storybook');
        const generateLocaleStories = config.get<boolean>('generateLocaleStories', true);
        const autoDocs = config.get<boolean>('autoDocs', false);

        const generator = new StoryGenerator(det, {
          generateLocaleStories,
          autoDocs,
        });
        const stories = await generator.generateStories();
        vscode.window.showInformationMessage(`Generated ${stories.length} Storybook story file(s)`);
      } catch (error: unknown) {
        log.error('Failed to generate stories:', error);
        vscode.window.showErrorMessage(`Failed to generate stories: ${getErrorMessage(error)}`);
      }
    },
  );

  // Register the Clean Storybook command
  const cleanStorybookCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.cleanStorybook',
    async () => {
      const det = getDetector();
      if (!det) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const isSpfx = await det.isSpfxProject();
      if (!isSpfx) {
        vscode.window.showErrorMessage('This does not appear to be an SPFx project');
        return;
      }

      try {
        // If panel is open, dispose it (stops server and cleans up)
        const panel = StorybookPanel.currentPanel;
        if (panel) {
          await panel.dispose();
        }

        // Delete the temp/storybook directory
        const storybookDir = path.join(det.workspacePath, 'temp', 'storybook');
        try {
          await vscode.workspace.fs.delete(vscode.Uri.file(storybookDir), {
            recursive: true,
            useTrash: false,
          });
        } catch (deleteError: unknown) {
          // Directory might not exist, which is fine
          if (!isFileNotFoundError(deleteError)) {
            throw deleteError;
          }
        }

        vscode.window.showInformationMessage('SPFx Storybook installation cleaned successfully');
      } catch (error: unknown) {
        log.error('Failed to clean SPFx Storybook:', error);
        vscode.window.showErrorMessage(`Failed to clean SPFx Storybook: ${getErrorMessage(error)}`);
      }
    },
  );

  // Auto-detect SPFx projects and show status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

  async function updateStatusBar() {
    const det = getDetector();
    if (det) {
      const isSpfx = await det.isSpfxProject();

      if (isSpfx) {
        const version = await det.getSpfxVersion();
        const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');
        const action = config.get<string>('statusBarAction', 'openWorkbench');

        // Set command, tooltip, and icon based on configuration
        const versionString = `SPFx Project detected${version ? ` (${version})` : ''}`;
        let icon = 'fluentui-testbeaker';
        switch (action) {
          case 'startServeWorkbench':
            statusBarItem.command = 'spfx-local-workbench.startServeWorkbench';
            statusBarItem.tooltip = `${versionString}\nClick to start serve and open the Local Workbench panel`;
            icon = 'fluentui-testbeakersolid';
            break;
          case 'startServeStorybook':
            statusBarItem.command = 'spfx-local-workbench.startServeStorybook';
            statusBarItem.tooltip = `${versionString}\nClick to start serve and open the SPFx Storybook panel`;
            icon = 'fluentui-teststep';
            break;
          case 'openStorybook':
            statusBarItem.command = 'spfx-local-workbench.openStorybook';
            statusBarItem.tooltip = `${versionString}\nClick to open the SPFx Storybook panel`;
            icon = 'fluentui-teststep';
            break;
          case 'openWorkbench':
          default:
            statusBarItem.command = 'spfx-local-workbench.openWorkbench';
            statusBarItem.tooltip = `${versionString}\nClick to open the Local Workbench panel`;
            icon = 'fluentui-testbeaker';
            break;
        }

        statusBarItem.text = `$(${icon}) SPFx Workbench`;
        statusBarItem.show();
      } else {
        statusBarItem.hide();
      }
    } else {
      statusBarItem.hide();
    }
  }

  // Update status bar on activation and workspace changes
  updateStatusBar();
  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    detector = undefined; // Reset cached detector on folder change
    updateStatusBar();
  });

  // Update status bar when configuration changes
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('spfxLocalWorkbench.statusBarAction')) {
      updateStatusBar();
    }
  });

  // Watch for manifest changes
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder) {
    const watcher = createManifestWatcher(workspaceFolder, () => {
      // Reload manifests in the panel if it's open
      if (WorkbenchPanel.currentPanel) {
        WorkbenchPanel.currentPanel.refreshManifests();
      }
    });
    context.subscriptions.push(watcher);
  }

  context.subscriptions.push(
    openWorkbenchCommand,
    startServeWorkbenchCommand,
    startServeStorybookCommand,
    detectWebPartsCommand,
    openDevToolsCommand,
    openStorybookCommand,
    generateStoriesCommand,
    cleanStorybookCommand,
    statusBarItem,
  );
}

// Serializer to restore webview panel state across VS Code restarts
class WorkbenchPanelSerializer implements vscode.WebviewPanelSerializer {
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _getDetector: () => SpfxProjectDetector | undefined,
  ) {}

  async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: any): Promise<void> {
    // Check if current workspace is an SPFx project
    const detector = this._getDetector();
    if (detector) {
      const isSpfx = await detector.isSpfxProject();

      if (isSpfx) {
        // Revive the panel
        WorkbenchPanel.revive(webviewPanel, this._extensionUri);
        return;
      }
    }

    // Not an SPFx project - close the panel
    webviewPanel.dispose();
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
