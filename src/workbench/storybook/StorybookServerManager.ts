import { ChildProcess, spawn } from 'child_process';
import * as net from 'net';
import * as path from 'path';
import * as vscode from 'vscode';

import {
  DEFAULT_STORYBOOK_PORT,
  PROCESS_FORCE_KILL_TIMEOUT_MS,
  STORYBOOK_STARTUP_TIMEOUT_MS,
} from '@spfx-local-workbench/shared';
import { getErrorMessage } from '@spfx-local-workbench/shared/utils/errorUtils';
import { logger } from '@spfx-local-workbench/shared/utils/logger';

import { SpfxProjectDetector } from '../SpfxProjectDetector';
import type { IStorybookThemeColors } from '../types';
import { StoryGenerator } from './StoryGenerator';

/**
 * Configuration options for the Storybook server
 */
export interface IStorybookServerOptions {
  /** Port to run Storybook on (default: 6006) */
  port?: number;
  /** Host to bind to (default: localhost) */
  host?: string;
  /** Whether to auto-open browser (default: false) */
  open?: boolean;
  /** Timeout for server startup in ms (default: 60000) */
  startupTimeout?: number;
}

/**
 * Server status
 */
export type ServerStatus = 'stopped' | 'starting' | 'running' | 'error';

/**
 * Status update callback type
 */
export type StatusUpdateCallback = (title: string, message: string) => void;

/**
 * Manages the Storybook development server lifecycle
 */
export class StorybookServerManager {
  private log = logger.createChild('StorybookServer');
  private process: ChildProcess | null = null;
  private status: ServerStatus = 'stopped';
  private port: number = DEFAULT_STORYBOOK_PORT;
  private host: string = 'localhost';
  private outputChannel: vscode.OutputChannel;
  private readyPromise: Promise<void> | null = null;
  private storyGenerator: StoryGenerator;
  private readonly storybookDir: string;
  private statusCallback?: StatusUpdateCallback;
  private pendingThemeColors?: IStorybookThemeColors;

  constructor(
    private workspacePath: string,
    private detector: SpfxProjectDetector,
    private extensionUri: vscode.Uri,
    outputChannel?: vscode.OutputChannel,
    statusCallback?: StatusUpdateCallback,
  ) {
    this.outputChannel = outputChannel || vscode.window.createOutputChannel('SPFx Storybook');
    this.storybookDir = path.join(workspacePath, 'temp', 'storybook');
    this.statusCallback = statusCallback;

    // Read storybook configuration from VS Code settings
    const config = vscode.workspace.getConfiguration('spfxLocalWorkbench.storybook');
    const generateLocaleStories = config.get<boolean>('generateLocaleStories', true);
    const autoDocs = config.get<boolean>('autoDocs', false);

    this.storyGenerator = new StoryGenerator(detector, {
      generateLocaleStories,
      autoDocs,
    });
  }

  /**
   * Start the Storybook server
   */
  public async start(
    options: IStorybookServerOptions = {},
    themeColors?: IStorybookThemeColors,
  ): Promise<void> {
    if (this.status === 'running' || this.status === 'starting') {
      this.outputChannel.appendLine('Storybook is already running or starting');
      return this.readyPromise || Promise.resolve();
    }

    this.pendingThemeColors = themeColors;

    this.port = options.port || DEFAULT_STORYBOOK_PORT;
    this.host = options.host || 'localhost';
    const startupTimeout = options.startupTimeout || STORYBOOK_STARTUP_TIMEOUT_MS;

    // Check if port is already in use
    const portAvailable = await this.isPortAvailable(this.port);
    if (!portAvailable) {
      const message = `Port ${this.port} is already in use. Storybook may already be running.`;
      this.outputChannel.appendLine(`ERROR: ${message}`);
      this.status = 'error';
      throw new Error(message);
    }

    this.status = 'starting';
    this.outputChannel.clear();
    this.outputChannel.appendLine(`Starting Storybook server on ${this.host}:${this.port}...`);
    this.outputChannel.show(true);

    try {
      // Generate/update stories before starting
      this.statusCallback?.('Preparing Storybook...', 'Generating stories from SPFx manifests');
      await this.generateStories();

      // Check for Storybook installation
      const hasStorybook = await this.checkStorybookInstallation();
      if (!hasStorybook) {
        this.statusCallback?.(
          'Requesting dependency installation...',
          'Please respond to the installation prompt',
        );
        await this.initializeStorybook();
      }

      // Write theme.json for manager.ts to consume before the server starts.
      // This runs unconditionally so the file is always fresh for the current session.
      await this.writeVsCodeThemeJson();

      // Start the server
      this.statusCallback?.('Starting Storybook...', 'Launching the development server');
      this.readyPromise = this.spawnStorybookProcess(options, startupTimeout);
      await this.readyPromise;

      this.status = 'running';
      this.outputChannel.appendLine(`✓ Storybook is ready at ${this.getUrl()}`);
    } catch (error: unknown) {
      this.status = 'error';
      this.log.error('Failed to start Storybook:', error);
      this.outputChannel.appendLine(`ERROR: Failed to start Storybook: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Stop the Storybook server
   */
  public async stop(): Promise<void> {
    if (!this.process) {
      this.status = 'stopped';
      return;
    }

    return new Promise<void>((resolve) => {
      if (!this.process) {
        this.status = 'stopped';
        resolve();
        return;
      }

      this.outputChannel.appendLine('Stopping Storybook server...');

      // Force kill after timeout if still running
      const forceKillTimeout = setTimeout(() => {
        if (this.process) {
          this.outputChannel.appendLine('Force killing Storybook process...');
          this.process.kill('SIGKILL');
        }
      }, PROCESS_FORCE_KILL_TIMEOUT_MS);

      this.process.once('exit', () => {
        clearTimeout(forceKillTimeout);
        this.process = null;
        this.status = 'stopped';
        this.readyPromise = null;
        this.outputChannel.appendLine('Storybook server stopped');
        resolve();
      });

      // Try graceful shutdown first
      this.process.kill('SIGTERM');
    });
  }

  /**
   * Restart the Storybook server.
   * Preserves the previously captured theme colors so that callers that bypass
   * StorybookPanel.startServer() (e.g. re-render with new options) don't lose
   * the theme established during the original start.
   */
  public async restart(options?: IStorybookServerOptions): Promise<void> {
    await this.stop();
    await this.start(options, this.pendingThemeColors);
  }

  /**
   * Get the current server status
   */
  public getStatus(): ServerStatus {
    return this.status;
  }

  /**
   * Check if the server is running
   */
  public isRunning(): boolean {
    return this.status === 'running';
  }

  /**
   * Get the server URL
   */
  public getUrl(): string {
    return `http://${this.host}:${this.port}`;
  }

  /**
   * Regenerate stories from current manifests
   */
  public async generateStories(): Promise<void> {
    this.outputChannel.appendLine('Generating Storybook stories from SPFx manifests...');

    try {
      const stories = await this.storyGenerator.generateStories();
      this.outputChannel.appendLine(`✓ Generated ${stories.length} story file(s)`);

      for (const story of stories) {
        this.outputChannel.appendLine(`  - ${path.basename(story.filePath)}`);
      }
    } catch (error: unknown) {
      this.log.warn('Failed to generate stories:', error);
      this.outputChannel.appendLine(
        `WARNING: Failed to generate stories: ${getErrorMessage(error)}`,
      );
      // Don't throw - allow server to start even if story generation fails
    }
  }

  /**
   * Writes theme.json to the .storybook config directory.
   * Contains VS Code colors extracted from the webview, or an empty object when
   * colors were unavailable — in which case Storybook uses its own built-in defaults.
   * Called unconditionally before each server start so the file is always current.
   */
  private async writeVsCodeThemeJson(): Promise<void> {
    const configDir = path.join(this.storybookDir, '.storybook');
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(configDir));

    const themeSetting = vscode.workspace
      .getConfiguration('spfxLocalWorkbench.storybook')
      .get<string>('theme', 'matchVsCode');

    let themeData: Record<string, unknown>;
    let status: string;

    if (themeSetting === 'light') {
      themeData = { base: 'light' };
      status = 'light (forced)';
    } else if (themeSetting === 'dark') {
      themeData = { base: 'dark' };
      status = 'dark (forced)';
    } else if (this.pendingThemeColors) {
      // matchVsCode with captured colors
      themeData = { ...this.pendingThemeColors, appBorderRadius: 4, inputBorderRadius: 2 };
      status = `base: ${this.pendingThemeColors.base} (matched from VS Code)`;
    } else {
      // matchVsCode but colors unavailable — let Storybook use its own defaults
      themeData = {};
      status = 'no colors captured (using Storybook defaults)';
    }

    const jsonPath = path.join(configDir, 'theme.json');
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(jsonPath),
      Buffer.from(JSON.stringify(themeData, null, 2), 'utf-8'),
    );

    this.outputChannel.appendLine(`✓ Written theme.json (${status})`);
  }

  /**
   * Dispose of resources
   */
  public async dispose(): Promise<void> {
    // Stop the server gracefully if running
    if (this.process) {
      await this.stop();
    }

    // Clean up status
    this.status = 'stopped';
    this.readyPromise = null;

    // Dispose output channel
    this.outputChannel.dispose();
  }

  /**
   * Strip ANSI escape codes from output
   */
  private stripAnsiCodes(text: string): string {
    // Remove ANSI escape sequences and other terminal control codes
    return text
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // CSI sequences
      .replace(/\x1b\][0-9;]*;[^\x07]*\x07/g, '') // OSC sequences
      .replace(/\x1b[=>]/g, '') // Other escape sequences
      .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '') // Extended CSI
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Other control chars
  }

  /**
   * Check if a port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port, this.host);
    });
  }

  /**
   * Check if Storybook is installed and configured
   */
  private async checkStorybookInstallation(): Promise<boolean> {
    const configDir = path.join(this.storybookDir, '.storybook');
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(configDir));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize Storybook configuration
   */
  private async initializeStorybook(): Promise<void> {
    this.outputChannel.appendLine(
      'Storybook not detected. Initializing Storybook configuration...',
    );

    // Check if required dependencies are installed
    const hasDependencies = await this.checkStorybookDependencies();

    if (!hasDependencies) {
      const config = vscode.workspace.getConfiguration('spfxLocalWorkbench.storybook');
      const skipPrompt = config.get<boolean>('skipInstallPrompt', false);

      if (!skipPrompt) {
        const choice = await vscode.window.showInformationMessage(
          'SPFx Storybook needs to install dependencies to run.',
          {
            modal: true,
            detail:
              'Dependencies will be installed in temp/storybook (isolated from your project). Your project files will not be modified. You can remove these dependencies anytime using "SPFx: Clean SPFx Storybook".',
          },
          'Install Dependencies',
        );

        if (choice !== 'Install Dependencies') {
          this.status = 'stopped';
          vscode.window.showInformationMessage(
            'Storybook dependencies are required. Close and reopen the panel to try again.',
          );
          throw new Error('Storybook dependencies installation was cancelled.');
        }
      }

      this.statusCallback?.('Installing dependencies...', 'This may take a moment');
      await this.createPackageJson();
      await this.installStorybookDependencies();
    }

    const configDir = path.join(this.storybookDir, '.storybook');
    const mainTs = path.join(configDir, 'main.ts');
    const previewTs = path.join(configDir, 'preview.ts');
    const managerTs = path.join(configDir, 'manager.ts');

    // Create .storybook directory
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(configDir));

    // Read template files from the extension
    const mainConfig = await this.readTemplateFile('main.ts');
    const previewConfig = await this.readTemplateFile('preview.ts');
    const managerConfig = await this.readTemplateFile('manager.ts');

    await vscode.workspace.fs.writeFile(vscode.Uri.file(mainTs), Buffer.from(mainConfig, 'utf-8'));

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(previewTs),
      Buffer.from(previewConfig, 'utf-8'),
    );

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(managerTs),
      Buffer.from(managerConfig, 'utf-8'),
    );

    this.outputChannel.appendLine('✓ Created Storybook configuration files');
  }

  /**
   * Read a template file from the extension's templates directory
   */
  private async readTemplateFile(filename: string): Promise<string> {
    const templatePath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'templates', filename);
    try {
      const content = await vscode.workspace.fs.readFile(templatePath);
      return content.toString();
    } catch (error: unknown) {
      this.log.error(`Failed to read template file ${filename}:`, error);
      throw new Error(`Failed to read template file ${filename}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create package.json in temp/storybook directory
   */
  private async createPackageJson(): Promise<void> {
    // Ensure temp/storybook directory exists
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(this.storybookDir));

    const packageJsonPath = path.join(this.storybookDir, 'package.json');

    const packageJson = {
      name: 'spfx-storybook-isolated',
      version: '1.0.0',
      private: true,
      description: 'Isolated Storybook installation for SPFx project',
      scripts: {
        storybook: 'storybook dev -p 6006',
      },
      devDependencies: {},
    };

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(packageJsonPath),
      Buffer.from(JSON.stringify(packageJson, null, 2), 'utf-8'),
    );

    this.outputChannel.appendLine('✓ Created package.json in temp/storybook');
  }

  /**
   * Check if Storybook dependencies are installed
   */
  private async checkStorybookDependencies(): Promise<boolean> {
    const packageJsonPath = path.join(this.storybookDir, 'package.json');

    try {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(packageJsonPath));
      const packageJson = JSON.parse(content.toString());
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const required = [
        'storybook',
        '@storybook/react-vite',
        '@storybook/addon-essentials',
        '@storybook/addon-a11y',
      ];

      return required.every((dep) => dep in allDeps);
    } catch {
      return false;
    }
  }

  /**
   * Install Storybook dependencies
   */
  private async installStorybookDependencies(): Promise<void> {
    this.outputChannel.appendLine('Installing Storybook dependencies in temp/storybook...');

    // Install Storybook v8 packages (pinned to avoid version conflicts)
    // Using v8 as it's stable and proven. v10 has peer dependency issues.
    // Pin React 17 to match SPFx runtime expectations (ReactDOM.render API).
    // Storybook 8 would otherwise resolve React 18 which removes ReactDOM.render.
    await this.runNpmInstall([
      'react@17.0.2',
      'react-dom@17.0.2',
      'storybook@^8.0.0',
      '@storybook/react-vite@^8.0.0',
      '@storybook/addon-essentials@^8.0.0',
      '@storybook/addon-a11y@^8.0.0',
    ]);

    // Then link the addon from the extension
    await this.linkAddon();
  }

  /**
   * Run npm install with specified packages
   */
  private async runNpmInstall(packages: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', '--save-dev', ...packages], {
        cwd: this.storybookDir,
        shell: true,
      });

      npm.stdout?.on('data', (data: Buffer) => {
        this.outputChannel.append(data.toString());
      });

      npm.stderr?.on('data', (data: Buffer) => {
        this.outputChannel.append(data.toString());
      });

      npm.on('close', (code) => {
        if (code === 0) {
          this.outputChannel.appendLine('✓ Storybook dependencies installed');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });

      npm.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Link the SPFx Storybook addon from the extension
   */
  private async linkAddon(): Promise<void> {
    this.outputChannel.appendLine('Linking @spfx-local-workbench/storybook-addon-spfx...');

    try {
      // Get the path to the addon in the extension packages directory
      const extensionAddonPath = path.join(
        this.extensionUri.fsPath,
        'packages',
        'storybook-addon-spfx',
      );

      // Update package.json with file: reference to the addon
      const packageJsonPath = path.join(this.storybookDir, 'package.json');
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(packageJsonPath));
      const packageJson = JSON.parse(content.toString());

      // Add file:// reference to the addon (relative path from storybook dir)
      const addonPath = path.relative(this.storybookDir, extensionAddonPath);
      packageJson.devDependencies['@spfx-local-workbench/storybook-addon-spfx'] =
        `file:${addonPath.replace(/\\/g, '/')}`;

      await vscode.workspace.fs.writeFile(
        vscode.Uri.file(packageJsonPath),
        Buffer.from(JSON.stringify(packageJson, null, 2), 'utf-8'),
      );

      this.outputChannel.appendLine(`Addon path: ${addonPath}`);

      // Run npm install to install the addon
      await this.runNpmInstall([]);

      this.outputChannel.appendLine('✓ Addon linked successfully');
    } catch (error: unknown) {
      this.log.warn('Could not link addon:', error);
      this.outputChannel.appendLine(`Warning: Could not link addon: ${getErrorMessage(error)}`);
      this.outputChannel.appendLine(
        'You may need to install @spfx-local-workbench/storybook-addon-spfx manually',
      );
    }
  }

  /**
   * Spawn the Storybook process
   */
  private spawnStorybookProcess(options: IStorybookServerOptions, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        'storybook',
        'dev',
        '-p',
        this.port.toString(),
        '--host',
        this.host,
        '--ci', // Run in CI mode to disable interactive prompts
      ];

      if (!options.open) {
        args.push('--no-open');
      }

      // Use npx to run storybook from temp/storybook directory
      this.process = spawn('npx', args, {
        cwd: this.storybookDir,
        shell: true,
        env: {
          ...process.env,
          FORCE_COLOR: '0', // Disable ANSI color codes for cleaner output
          CI: 'true', // Run in CI mode to disable interactive prompts
          NO_COLOR: '1', // Additional color disable flag
        },
      });

      let isResolved = false;
      const timeoutHandle = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`Storybook failed to start within ${timeout}ms`));
        }
      }, timeout);

      // Monitor stdout for ready message
      this.process.stdout?.on('data', (data: Buffer) => {
        const output = this.stripAnsiCodes(data.toString());
        this.outputChannel.append(output);

        // Look for "Local:" in output to detect when server is ready
        if (!isResolved && /Local:\s+https?:\/\//.test(output)) {
          clearTimeout(timeoutHandle);
          isResolved = true;
          resolve();
        }
      });

      // Monitor stderr
      this.process.stderr?.on('data', (data: Buffer) => {
        const output = this.stripAnsiCodes(data.toString());
        this.outputChannel.append(output);
      });

      // Handle process errors
      this.process.on('error', (error) => {
        this.outputChannel.appendLine(`Process error: ${error.message}`);
        if (!isResolved) {
          clearTimeout(timeoutHandle);
          isResolved = true;
          reject(error);
        }
      });

      // Handle process exit
      this.process.on('exit', (code) => {
        if (code !== 0 && !isResolved) {
          clearTimeout(timeoutHandle);
          isResolved = true;
          reject(new Error(`Storybook process exited with code ${code}`));
        }
      });
    });
  }
}
