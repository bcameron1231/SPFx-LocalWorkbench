import * as path from 'path';
import * as vscode from 'vscode';

import { DEFAULT_SPFX_SERVE_PORT } from '@spfx-local-workbench/shared';
import { getErrorMessage, isFileNotFoundError } from '@spfx-local-workbench/shared';
import { logger } from '@spfx-local-workbench/shared';
import {
  initializeLocalization,
  isPortReachable,
  localize,
} from '@spfx-local-workbench/shared/utils/node';

import {
  ApiProxyService,
  MockConfigGenerator,
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
  // Initialize localization
  initializeLocalization(
    'extension',
    path.join(context.extensionPath, 'dist'),
    () => vscode.env.language,
  );

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
      vscode.window.showErrorMessage(localize('extension.noWorkspace', 'No workspace folder open'));
      return false;
    }

    const isSpfx = await det.isSpfxProject();
    if (!isSpfx) {
      vscode.window.showErrorMessage(
        localize('extension.notSpfx', 'This does not appear to be an SPFx project'),
      );
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

        progress.report({ message: localize('serve.waiting', 'Waiting for serve to start…') });

        while (Date.now() - startTime < maxWaitMs) {
          if (cancellationToken.isCancellationRequested) {
            return false;
          }

          if (await isPortReachable(serveHost, servePort)) {
            return true;
          }

          const elapsed = Math.round((Date.now() - startTime) / 1000);
          progress.report({
            message: localize(
              'serve.waitingElapsed',
              'Waiting for serve to start… ({0}s)',
              elapsed,
            ),
          });
          await delay(pollIntervalMs);
        }

        return false; // timed out
      },
    );

    if (!serverReady) {
      const openChoice = localize('common.open', 'Open');
      const choice = await vscode.window.showWarningMessage(
        localize('serve.timedout', 'SPFx serve did not start in time. Open workbench anyway?'),
        openChoice,
        localize('common.cancel', 'Cancel'),
      );
      return choice === openChoice;
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
      new StorybookPanelSerializer(context.extensionUri, context.extensionMode, getDetector),
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
        vscode.window.showWarningMessage(
          localize('extension.noWorkspace', 'No workspace folder open'),
        );
        return;
      }

      const manifests = await det.getWebPartManifests();
      if (manifests.length === 0) {
        vscode.window.showInformationMessage(
          localize('detect.noWebParts', 'No web parts found in this project'),
        );
      } else {
        const webPartNames = manifests.map((m) => m.alias || m.id).join(', ');
        vscode.window.showInformationMessage(
          localize('detect.found', 'Found {0} web part(s): {1}', manifests.length, webPartNames),
        );
      }
    },
  );

  // Register the Open DevTools command
  const openDevToolsCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.openDevTools',
    () => {
      vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools');
    },
  );

  // Register the Open Settings command
  const openSettingsCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.openSettings',
    () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        '@ext:BeauCameron.spfx-local-workbench',
      );
    },
  );

  // Register the Switch to Display Mode command
  const switchToDisplayModeCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.switchToDisplayMode',
    () => {
      if (WorkbenchPanel.currentPanel) {
        WorkbenchPanel.currentPanel.switchToDisplayMode();
      }
    },
  );

  // Register the Switch to Edit Mode command
  const switchToEditModeCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.switchToEditMode',
    () => {
      if (WorkbenchPanel.currentPanel) {
        WorkbenchPanel.currentPanel.switchToEditMode();
      }
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

      await StorybookPanel.createOrShow(context.extensionUri, context.extensionMode, det);
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
          await StorybookPanel.createOrShow(context.extensionUri, context.extensionMode, det);
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
        vscode.window.showErrorMessage(
          localize('extension.noWorkspace', 'No workspace folder open'),
        );
        return;
      }

      const isSpfx = await det.isSpfxProject();
      if (!isSpfx) {
        vscode.window.showErrorMessage(
          localize('extension.notSpfx', 'This does not appear to be an SPFx project'),
        );
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
        vscode.window.showErrorMessage(
          localize('extension.noWorkspace', 'No workspace folder open'),
        );
        return;
      }

      const isSpfx = await det.isSpfxProject();
      if (!isSpfx) {
        vscode.window.showErrorMessage(
          localize('extension.notSpfx', 'This does not appear to be an SPFx project'),
        );
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

  // Register the Scaffold Mock Config command
  const scaffoldMockConfigCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.scaffoldMockConfig',
    async () => {
      const wsFolder = vscode.workspace.workspaceFolders?.[0];
      if (!wsFolder) {
        vscode.window.showWarningMessage(
          localize('extension.noWorkspace', 'No workspace folder open'),
        );
        return;
      }
      const proxy = new ApiProxyService(wsFolder.uri.fsPath);
      await proxy.scaffoldMockConfig();
      proxy.dispose();
      vscode.window.showInformationMessage(
        localize(
          'mock.scaffolded',
          'API mock configuration scaffolded at .spfx-workbench/api-mocks.json',
        ),
      );
    },
  );

  // ── Mock Data Commands ──────────────────────────────────────────

  // Mock Data menu button — opens a quick pick with all mock data actions
  const mockDataMenuCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.mockDataMenu',
    async () => {
      const items: (vscode.QuickPickItem & { commandId: string })[] = [
        {
          label: `$(file-add) ${localize('mock.scaffold.label', 'Scaffold Mock Config')}`,
          description: localize(
            'mock.scaffold.description',
            'Create a starter api-mocks.json file',
          ),
          commandId: 'spfx-local-workbench.scaffoldMockConfig',
        },
        {
          label: `$(symbol-number) ${localize('mock.generate.label', 'Generate Status Code Stubs')}`,
          description: localize(
            'mock.generate.description',
            'Create rules for 200, 401, 404, 500, etc.',
          ),
          commandId: 'spfx-local-workbench.generateStatusStubs',
        },
        {
          label: `$(json) ${localize('mock.importJson.label', 'Import JSON File')}`,
          description: localize(
            'mock.importJson.description',
            'Use a JSON file as a mock response body',
          ),
          commandId: 'spfx-local-workbench.importJsonMock',
        },
        {
          label: `$(table) ${localize('mock.importCsv.label', 'Import CSV File')}`,
          description: localize(
            'mock.importCsv.description',
            'Parse CSV rows into a JSON mock response',
          ),
          commandId: 'spfx-local-workbench.importCsvMock',
        },
        {
          label: `$(record) ${localize('mock.record.label', 'Record Requests')}`,
          description: localize(
            'mock.record.description',
            'Capture unmatched requests and generate rules',
          ),
          commandId: 'spfx-local-workbench.recordRequests',
        },
      ];

      const pick = await vscode.window.showQuickPick(items, {
        title: localize('mock.title', 'Mock Data'),
        placeHolder: localize('mock.placeholder', 'Choose an action'),
      });

      if (pick) {
        await vscode.commands.executeCommand(pick.commandId);
      }
    },
  );

  // Helper to create a MockConfigGenerator for the current workspace
  function createGenerator(): MockConfigGenerator | undefined {
    const wsFolder = vscode.workspace.workspaceFolders?.[0];
    if (!wsFolder) {
      vscode.window.showWarningMessage(
        localize('extension.noWorkspace', 'No workspace folder open'),
      );
      return undefined;
    }
    const settings = ApiProxyService.readSettings();
    const { activeMode } = settings;
    const mockFile =
      activeMode.mode === 'mock' || activeMode.mode === 'record'
        ? activeMode.options.mockFile
        : undefined;
    return new MockConfigGenerator(wsFolder.uri.fsPath, mockFile);
  }

  // Generate status-code stubs via interactive wizard
  const generateStatusStubsCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.generateStatusStubs',
    async () => {
      const gen = createGenerator();
      if (!gen) {
        return;
      }
      const ok = await gen.generateStatusStubs();
      if (ok) {
        vscode.window.showInformationMessage(
          localize('mock.generated', 'Mock rules generated successfully.'),
        );
      }
    },
  );

  // Import a JSON file as mock response body
  const importJsonCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.importJsonMock',
    async () => {
      const gen = createGenerator();
      if (!gen) {
        return;
      }
      const ok = await gen.importJsonFile();
      if (ok) {
        vscode.window.showInformationMessage(
          localize('mock.importJson.success', 'JSON file imported as mock rule.'),
        );
      }
    },
  );

  // Import a CSV file as mock response body
  const importCsvCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.importCsvMock',
    async () => {
      const gen = createGenerator();
      if (!gen) {
        return;
      }
      const ok = await gen.importCsvFile();
      if (ok) {
        vscode.window.showInformationMessage(
          localize('mock.importCsv.success', 'CSV file imported as mock rule.'),
        );
      }
    },
  );

  // Record unmatched requests and generate rules from them
  const recordingStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  recordingStatusBar.command = 'spfx-local-workbench.recordRequests';
  recordingStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');

  const recordRequestsCommand = vscode.commands.registerCommand(
    'spfx-local-workbench.recordRequests',
    async () => {
      // Use the WorkbenchPanel's proxy service — that's where actual requests flow
      const proxy = WorkbenchPanel.currentPanel?.apiProxyService;
      if (!proxy) {
        vscode.window.showWarningMessage(
          localize('record.openFirst', 'Open the workbench first, then start recording.'),
        );
        return;
      }

      // If already recording, stop and generate
      if (proxy.isRecording) {
        const requests = proxy.stopRecording();
        recordingStatusBar.hide();

        if (requests.length === 0) {
          vscode.window.showInformationMessage(
            localize(
              'record.noRequests',
              'No unmatched requests were recorded. All requests may have matched existing rules.',
            ),
          );
          return;
        }

        const gen = createGenerator();
        if (gen) {
          const ok = await gen.generateFromRecordedRequests(requests);
          if (ok) {
            vscode.window.showInformationMessage(
              localize(
                'record.generated',
                'Generated rules from {0} recorded request(s).',
                requests.length,
              ),
            );
          }
        }
        return;
      }

      // Start recording
      proxy.startRecording();
      recordingStatusBar.text = `$(record) ${localize('recording.statusText', 'Recording API Requests...')}`;
      recordingStatusBar.tooltip = localize(
        'recording.tooltip',
        'Click to stop recording and generate mock rules',
      );
      recordingStatusBar.show();

      // Refresh the workbench so web parts re-initialize and make their API calls
      if (WorkbenchPanel.currentPanel) {
        WorkbenchPanel.currentPanel.postMessage({ command: 'refresh' });
      }

      vscode.window.showInformationMessage(
        localize(
          'recording.inProgress',
          'Recording API requests. Web parts are being refreshed. Click the status bar or run this command again to stop and generate rules.',
        ),
      );
    },
  );

  // Auto-detect SPFx projects and show status bar items
  const workbenchStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    101,
  );
  const storybookStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );

  async function updateStatusBar() {
    const det = getDetector();
    if (det) {
      const isSpfx = await det.isSpfxProject();

      if (isSpfx) {
        const version = await det.getSpfxVersion();
        const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');
        const versionString = `SPFx Project detected${version ? ` (${version})` : ''}`;
        const display = config.get<string>('statusBarDisplay', 'iconAndText');

        if (display === 'hidden') {
          workbenchStatusBarItem.hide();
          storybookStatusBarItem.hide();
          return;
        }

        // Workbench button
        const workbenchAction = config.get<string>('statusBarWorkbenchAction', 'openWorkbench');
        let workbenchIcon: string;
        if (workbenchAction === 'startServeWorkbench') {
          workbenchStatusBarItem.command = 'spfx-local-workbench.startServeWorkbench';
          workbenchStatusBarItem.tooltip = `${versionString}\nClick to start serve and open the Local Workbench panel`;
          workbenchIcon = 'fluentui-testbeakersolid';
        } else {
          workbenchStatusBarItem.command = 'spfx-local-workbench.openWorkbench';
          workbenchStatusBarItem.tooltip = `${versionString}\nClick to open the Local Workbench panel`;
          workbenchIcon = 'fluentui-testbeaker';
        }
        workbenchStatusBarItem.text =
          display === 'iconOnly' ? `$(${workbenchIcon})` : `$(${workbenchIcon}) SPFx Workbench`;
        workbenchStatusBarItem.show();

        // Storybook button
        const storybookAction = config.get<string>('statusBarStorybookAction', 'openStorybook');
        if (storybookAction === 'startServeStorybook') {
          storybookStatusBarItem.command = 'spfx-local-workbench.startServeStorybook';
          storybookStatusBarItem.tooltip = `${versionString}\nClick to start serve and open the SPFx Storybook panel`;
        } else {
          storybookStatusBarItem.command = 'spfx-local-workbench.openStorybook';
          storybookStatusBarItem.tooltip = `${versionString}\nClick to open the SPFx Storybook panel`;
        }
        storybookStatusBarItem.text =
          display === 'iconOnly' ? '$(fluentui-teststep)' : '$(fluentui-teststep) SPFx Storybook';
        storybookStatusBarItem.show();
      } else {
        workbenchStatusBarItem.hide();
        storybookStatusBarItem.hide();
      }
    } else {
      workbenchStatusBarItem.hide();
      storybookStatusBarItem.hide();
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
    if (
      e.affectsConfiguration('spfxLocalWorkbench.statusBarWorkbenchAction') ||
      e.affectsConfiguration('spfxLocalWorkbench.statusBarStorybookAction') ||
      e.affectsConfiguration('spfxLocalWorkbench.statusBarDisplay')
    ) {
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
    openSettingsCommand,
    switchToDisplayModeCommand,
    switchToEditModeCommand,
    openStorybookCommand,
    generateStoriesCommand,
    cleanStorybookCommand,
    scaffoldMockConfigCommand,
    mockDataMenuCommand,
    generateStatusStubsCommand,
    importJsonCommand,
    importCsvCommand,
    recordRequestsCommand,
    workbenchStatusBarItem,
    storybookStatusBarItem,
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
