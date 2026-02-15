import * as vscode from 'vscode';
import * as net from 'net';
import * as path from 'path';
import { WorkbenchPanel, SpfxProjectDetector, createManifestWatcher, getWorkbenchSettings, StorybookPanel, StorybookPanelSerializer, StoryGenerator } from './workbench';

function isPortReachable(host: string, port: number, timeout = 1000): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = new net.Socket();
		socket.setTimeout(timeout);
		socket.once('connect', () => { socket.destroy(); resolve(true); });
		socket.once('timeout', () => { socket.destroy(); resolve(false); });
		socket.once('error', () => { socket.destroy(); resolve(false); });
		socket.connect(port, host);
	});
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	// Shared detector instance — workspace path rarely changes
	let detector: SpfxProjectDetector | undefined;
	function getDetector(): SpfxProjectDetector | undefined {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) { return undefined; }
		if (!detector || detector.workspacePath !== workspaceFolder.uri.fsPath) {
			detector = new SpfxProjectDetector(workspaceFolder.uri.fsPath);
		}
		return detector;
	}

	// Register serializers to restore webviews on reload
	context.subscriptions.push(
		vscode.window.registerWebviewPanelSerializer(
			'spfxLocalWorkbench',
			new WorkbenchPanelSerializer(context.extensionUri, getDetector)
		),
		vscode.window.registerWebviewPanelSerializer(
			'spfxStorybook',
			new StorybookPanelSerializer(context.extensionUri, getDetector)
		)
	);

	// Register the Open Workbench command
	const openWorkbenchCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.openWorkbench',
		() => {
			WorkbenchPanel.createOrShow(context.extensionUri);
		}
	);

	// Register the Start Serve command
	const startServeCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.startServe',
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

			// Create a terminal and run heft start
			const terminal = vscode.window.createTerminal('SPFx Serve');
			terminal.show();
			terminal.sendText('heft start --clean --nobrowser');

			// Parse host/port from the configured serve URL
			const settings = getWorkbenchSettings();
			let serveHost = 'localhost';
			let servePort = 4321;
			try {
				const url = new URL(settings.serveUrl);
				serveHost = url.hostname;
				servePort = parseInt(url.port, 10) || (url.protocol === 'https:' ? 443 : 80);
			} catch {
				// Fall back to defaults
			}

			// Wait for the serve port to accept connections, with a progress indicator
			const serverReady = await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: 'SPFx Serve',
					cancellable: true
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
				}
			);

			if (serverReady) {
				WorkbenchPanel.createOrShow(context.extensionUri);
			} else {
				const choice = await vscode.window.showWarningMessage(
					'SPFx serve did not start in time. Open workbench anyway?',
					'Open', 'Cancel'
				);
				if (choice === 'Open') {
					WorkbenchPanel.createOrShow(context.extensionUri);
				}
			}
		}
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
				const webPartNames = manifests.map(m => m.alias || m.id).join(', ');
				vscode.window.showInformationMessage(`Found ${manifests.length} web part(s): ${webPartNames}`);
			}
		}
	);

	const openDevToolsCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.openDevTools',
		() => {
			vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools');
		}
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
		}
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
				const generator = new StoryGenerator(det);
				const stories = await generator.generateStories();
				vscode.window.showInformationMessage(
					`Generated ${stories.length} Storybook story file(s)`
				);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				vscode.window.showErrorMessage(`Failed to generate stories: ${errorMessage}`);
			}
		}
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
					await vscode.workspace.fs.delete(
						vscode.Uri.file(storybookDir),
						{ recursive: true, useTrash: false }
					);
				} catch (deleteError) {
					// Directory might not exist, which is fine
					const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
					if (!errorMessage.includes('ENOENT') && !errorMessage.includes('FileNotFound')) {
						throw deleteError;
					}
				}

				vscode.window.setStatusBarMessage('$(fluentui-broom) Storybook installation cleaned successfully', 7000);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				vscode.window.showErrorMessage(`Failed to clean Storybook: ${errorMessage}`);
			}
		}
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
					case 'startServe':
						statusBarItem.command = 'spfx-local-workbench.startServe';
						statusBarItem.tooltip = `${versionString}\nClick to start serve and open workbench`;
						icon = 'fluentui-testbeakersolid';
						break;
					case 'openStorybook':
						statusBarItem.command = 'spfx-local-workbench.openStorybook';
						statusBarItem.tooltip = `${versionString}\nClick to open Storybook`;
						icon = 'fluentui-teststep';
						break;
					case 'openWorkbench':
					default:
						statusBarItem.command = 'spfx-local-workbench.openWorkbench';
						statusBarItem.tooltip = `${versionString}\nClick to open local workbench`;
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
		startServeCommand,
		detectWebPartsCommand,
		openDevToolsCommand,
		openStorybookCommand,
		generateStoriesCommand,
		cleanStorybookCommand,
		statusBarItem
	);
}

// Serializer to restore webview panel state across VS Code restarts
class WorkbenchPanelSerializer implements vscode.WebviewPanelSerializer {
	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _getDetector: () => SpfxProjectDetector | undefined
	) {}

	async deserializeWebviewPanel(
		webviewPanel: vscode.WebviewPanel,
		_state: any
	): Promise<void> {
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
export function deactivate() { }
