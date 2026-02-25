import * as vscode from 'vscode';
import { WorkbenchPanel, SpfxProjectDetector, createManifestWatcher, getWorkbenchSettings, ApiProxyService, MockConfigGenerator } from './workbench';
import * as net from 'net';

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

	// Register serializer to restore webview on reload
	context.subscriptions.push(
		vscode.window.registerWebviewPanelSerializer(
			'spfxLocalWorkbench',
			new WorkbenchPanelSerializer(context.extensionUri, getDetector)
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

	// Register the Scaffold Mock Config command
	const scaffoldMockConfigCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.scaffoldMockConfig',
		async () => {
			const wsFolder = vscode.workspace.workspaceFolders?.[0];
			if (!wsFolder) {
				vscode.window.showWarningMessage('No workspace folder open');
				return;
			}
			const proxy = new ApiProxyService(wsFolder.uri.fsPath);
			await proxy.scaffoldMockConfig();
			proxy.dispose();
			vscode.window.showInformationMessage('API mock configuration scaffolded at .spfx-workbench/api-mocks.json');
	});
	
	const openDevToolsCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.openDevTools',
		() => {
			vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools');
		}
	);

	// ── Mock Data Commands ──────────────────────────────────────────

	// Mock Data menu button — opens a quick pick with all mock data actions
	const mockDataMenuCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.mockDataMenu',
		async () => {
			const items: (vscode.QuickPickItem & { commandId: string })[] = [
				{ label: '$(file-add) Scaffold Mock Config', description: 'Create a starter api-mocks.json file', commandId: 'spfx-local-workbench.scaffoldMockConfig' },
				{ label: '$(symbol-number) Generate Status Code Stubs', description: 'Create rules for 200, 401, 404, 500, etc.', commandId: 'spfx-local-workbench.generateStatusStubs' },
				{ label: '$(json) Import JSON File', description: 'Use a JSON file as a mock response body', commandId: 'spfx-local-workbench.importJsonMock' },
				{ label: '$(table) Import CSV File', description: 'Parse CSV rows into a JSON mock response', commandId: 'spfx-local-workbench.importCsvMock' },
				{ label: '$(record) Record Requests', description: 'Capture unmatched requests and generate rules', commandId: 'spfx-local-workbench.recordRequests' },
			];

			const pick = await vscode.window.showQuickPick(items, {
				title: 'Mock Data',
				placeHolder: 'Choose an action',
			});

			if (pick) {
				await vscode.commands.executeCommand(pick.commandId);
			}
		}
	);

	// Helper to create a MockConfigGenerator for the current workspace
	function createGenerator(): MockConfigGenerator | undefined {
		const wsFolder = vscode.workspace.workspaceFolders?.[0];
		if (!wsFolder) {
			vscode.window.showWarningMessage('No workspace folder open');
			return undefined;
		}
		const settings = ApiProxyService.readSettings();
		return new MockConfigGenerator(wsFolder.uri.fsPath, settings.mockFile);
	}

	// Generate status-code stubs via interactive wizard
	const generateStatusStubsCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.generateStatusStubs',
		async () => {
			const gen = createGenerator();
			if (!gen) { return; }
			const ok = await gen.generateStatusStubs();
			if (ok) {
				vscode.window.showInformationMessage('Mock rules generated successfully.');
			}
		}
	);

	// Import a JSON file as mock response body
	const importJsonCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.importJsonMock',
		async () => {
			const gen = createGenerator();
			if (!gen) { return; }
			const ok = await gen.importJsonFile();
			if (ok) {
				vscode.window.showInformationMessage('JSON file imported as mock rule.');
			}
		}
	);

	// Import a CSV file as mock response body
	const importCsvCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.importCsvMock',
		async () => {
			const gen = createGenerator();
			if (!gen) { return; }
			const ok = await gen.importCsvFile();
			if (ok) {
				vscode.window.showInformationMessage('CSV file imported as mock rule.');
			}
		}
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
				vscode.window.showWarningMessage('Open the workbench first, then start recording.');
				return;
			}

			// If already recording, stop and generate
			if (proxy.isRecording) {
				const requests = proxy.stopRecording();
				recordingStatusBar.hide();

				if (requests.length === 0) {
					vscode.window.showInformationMessage('No unmatched requests were recorded. All requests may have matched existing rules.');
					return;
				}

				const gen = createGenerator();
				if (gen) {
					const ok = await gen.generateFromRecordedRequests(requests);
					if (ok) {
						vscode.window.showInformationMessage(`Generated rules from ${requests.length} recorded request(s).`);
					}
				}
				return;
			}

			// Start recording
			proxy.startRecording();
			recordingStatusBar.text = '$(record) Recording API Requests...';
			recordingStatusBar.tooltip = 'Click to stop recording and generate mock rules';
			recordingStatusBar.show();

			// Refresh the workbench so web parts re-initialize and make their API calls
			if (WorkbenchPanel.currentPanel) {
				WorkbenchPanel.currentPanel.postMessage({ command: 'refresh' });
			}

			vscode.window.showInformationMessage(
				'Recording API requests. Web parts are being refreshed. Click the status bar or run this command again to stop and generate rules.',
			);
		}
	);

	// Auto-detect SPFx projects and show status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = 'spfx-local-workbench.openWorkbench';

	async function updateStatusBar() {
		const det = getDetector();
		if (det) {
			const isSpfx = await det.isSpfxProject();

			if (isSpfx) {
				const version = await det.getSpfxVersion();
				statusBarItem.text = `$(fluentui-testbeaker) SPFx Workbench`;
				statusBarItem.tooltip = `SPFx Project detected${version ? ` (${version})` : ''}\nClick to open local workbench`;
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
		scaffoldMockConfigCommand,
		openDevToolsCommand,
		mockDataMenuCommand,
		generateStatusStubsCommand,
		importJsonCommand,
		importCsvCommand,
		recordRequestsCommand,
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
