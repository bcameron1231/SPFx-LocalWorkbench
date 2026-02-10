import * as vscode from 'vscode';
import * as net from 'net';
import { WorkbenchPanel, SpfxProjectDetector, createManifestWatcher, getWorkbenchSettings } from './workbench';

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
	console.log('SPFx Local Workbench is now active!');

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

	// Auto-detect SPFx projects and show status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = 'spfx-local-workbench.openWorkbench';

	async function updateStatusBar() {
		const det = getDetector();
		if (det) {
			const isSpfx = await det.isSpfxProject();

			if (isSpfx) {
				const version = await det.getSpfxVersion();
				statusBarItem.text = `$(beaker) SPFx Workbench`;
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
		openDevToolsCommand,
		statusBarItem
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
