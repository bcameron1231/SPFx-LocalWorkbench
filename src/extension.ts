import * as vscode from 'vscode';
import { WorkbenchPanel, SpfxProjectDetector, createManifestWatcher } from './workbench';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('SPFx Local Workbench is now active!');
	vscode.window.showInformationMessage('SPFx Local Workbench activated!');

	// Register the Open Workbench command
	const openWorkbenchCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.openWorkbench',
		() => {
			vscode.window.showInformationMessage('Opening SPFx Workbench...');
			WorkbenchPanel.createOrShow(context.extensionUri);
		}
	);

	// Register the Start Serve command
	const startServeCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.startServe',
		async () => {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				vscode.window.showErrorMessage('No workspace folder open');
				return;
			}

			const detector = new SpfxProjectDetector(workspaceFolder.uri.fsPath);
			const isSpfx = await detector.isSpfxProject();

			if (!isSpfx) {
				vscode.window.showErrorMessage('This does not appear to be an SPFx project');
				return;
			}

		// Create a terminal and run heft start
		const terminal = vscode.window.createTerminal('SPFx Serve');
		terminal.show();
		terminal.sendText('heft start');

		// Open the workbench after a delay
		setTimeout(() => {
			WorkbenchPanel.createOrShow(context.extensionUri);
		}, 3000);
	}
);

	// Register the Detect Web Parts command
	const detectWebPartsCommand = vscode.commands.registerCommand(
		'spfx-local-workbench.detectWebParts',
		async () => {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				vscode.window.showWarningMessage('No workspace folder open');
				return;
			}

			const detector = new SpfxProjectDetector(workspaceFolder.uri.fsPath);
			const manifests = await detector.getWebPartManifests();

			if (manifests.length === 0) {
				vscode.window.showInformationMessage('No web parts found in this project');
			} else {
				const webPartNames = manifests.map(m => m.alias || m.id).join(', ');
				vscode.window.showInformationMessage(`Found ${manifests.length} web part(s): ${webPartNames}`);
			}
		}
	);

	// Auto-detect SPFx projects and show status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = 'spfx-local-workbench.openWorkbench';
	
	async function updateStatusBar() {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
			const detector = new SpfxProjectDetector(workspaceFolder.uri.fsPath);
			const isSpfx = await detector.isSpfxProject();
			
			if (isSpfx) {
				const version = await detector.getSpfxVersion();
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
	vscode.workspace.onDidChangeWorkspaceFolders(updateStatusBar);

	// Watch for manifest changes
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (workspaceFolder) {
		const watcher = createManifestWatcher(workspaceFolder, () => {
			// Refresh the workbench panel if it's open
			if (WorkbenchPanel.currentPanel) {
				vscode.commands.executeCommand('spfx-local-workbench.openWorkbench');
			}
		});
		context.subscriptions.push(watcher);
	}

	context.subscriptions.push(
		openWorkbenchCommand,
		startServeCommand,
		detectWebPartsCommand,
		statusBarItem
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
