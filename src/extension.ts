import * as vscode from 'vscode';
import { WorkbenchPanel, SpfxProjectDetector, createManifestWatcher, getWorkbenchSettings } from './workbench';

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

			// Poll the serve URL until it responds, then open the workbench
			const settings = getWorkbenchSettings();
			const serveUrl = settings.serveUrl;
			const maxAttempts = 60; // up to ~60 seconds
			let attempts = 0;
			const pollTimer = setInterval(async () => {
				attempts++;
				try {
					const response = await fetch(serveUrl, {
						method: 'HEAD',
						signal: AbortSignal.timeout(2000)
					});
					if (response.ok || response.status === 426) {
						// Server is up (426 = HTTPS upgrade expected, still means it's running)
						clearInterval(pollTimer);
						WorkbenchPanel.createOrShow(context.extensionUri);
					}
				} catch {
					// Not ready yet
				}
				if (attempts >= maxAttempts) {
					clearInterval(pollTimer);
					// Open anyway — user can manually refresh
					WorkbenchPanel.createOrShow(context.extensionUri);
				}
			}, 1000);
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
