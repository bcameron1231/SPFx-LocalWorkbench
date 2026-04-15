import { ChildProcess, spawn } from 'child_process';
import * as net from 'net';
import * as path from 'path';
import * as vscode from 'vscode';

import {
  DEFAULT_STORYBOOK_PORT,
  PROCESS_FORCE_KILL_TIMEOUT_MS,
  STORYBOOK_STARTUP_TIMEOUT_MS,
} from '@spfx-local-workbench/shared';
import { getErrorMessage, logger } from '@spfx-local-workbench/shared';

import { SpfxProjectDetector } from '../SpfxProjectDetector';
import { getCurrentTheme, getCustomThemes } from '../config';
import { ApiProxyService } from '../proxy/ApiProxyService';
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
    private extensionMode: vscode.ExtensionMode,
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

      // Write theme.json and preview.ts globals unconditionally so both files
      // are always up to date with current VS Code settings on every launch.
      // (initializeStorybook only runs on first launch, so without this the globals
      // written into preview.ts would become stale until a clean + reinstall.)
      await this.writeVsCodeThemeJson();
      await this.updatePreviewGlobals();

      // Copy mock files to Storybook's public directory so they're accessible to the addon
      await this.copyMockFiles();

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
    } else if (themeSetting === 'peacock') {
      themeData = this.buildPeacockTheme();
      status = `peacock (base: ${(themeData.base as string) ?? 'unknown'})`;
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
   * Re-writes preview.ts from the template with freshly injected VS Code globals
   * (current theme + custom themes).  Called unconditionally before every server
   * start so the globals are always current without requiring a Storybook clean.
   */
  private async updatePreviewGlobals(): Promise<void> {
    const configDir = path.join(this.storybookDir, '.storybook');
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(configDir));

    const previewTs = path.join(configDir, 'preview.ts');
    let previewConfig = await this.readTemplateFile('preview.ts');

    const customThemes = getCustomThemes();
    const defaultThemeName = getCurrentTheme().name;
    const proxyEnabled = vscode.workspace
      .getConfiguration('spfxLocalWorkbench.proxy')
      .get<boolean>('enabled', true);
    previewConfig += `\n// Injected by VS Code extension at startup\nexport const globals = {\n  spfxTheme: ${JSON.stringify(defaultThemeName)},\n  spfxCustomThemes: ${JSON.stringify(customThemes)},\n  spfxProxyEnabled: ${JSON.stringify(proxyEnabled)},\n};\n`;

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(previewTs),
      Buffer.from(previewConfig, 'utf-8'),
    );

    this.outputChannel.appendLine(
      `✓ Updated preview.ts globals (default theme: ${defaultThemeName}, customThemes: ${customThemes.length})`,
    );
  }

  /**
   * Copy mock files from workspace to Storybook static directory.
   * Copies the mock config to a fixed location (public/proxy/api-mocks.json) and
   * flattens all referenced body files into public/proxy/ with unique names.
   */
  private async copyMockFiles(): Promise<void> {
    // Read proxy settings to get the mock file location
    const proxySettings = ApiProxyService.readSettings();

    // Extract the mock file path from settings
    let mockFile: string;
    const { activeMode } = proxySettings;
    if (activeMode.mode === 'mock') {
      mockFile = activeMode.options.mockFile;
    } else if (activeMode.mode === 'record') {
      mockFile = activeMode.options.mockFile;
    } else {
      // Passthrough mode - no mocks to copy
      this.outputChannel.appendLine('Proxy in passthrough mode, skipping mock file copy');
      return;
    }

    const mockSourcePath = path.join(this.workspacePath, mockFile);
    const proxyDir = path.join(this.storybookDir, 'public', 'proxy');
    const mockDestPath = path.join(proxyDir, 'api-mocks.json');

    try {
      // Check if source mock config exists
      let mockConfigContent: string;
      try {
        const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(mockSourcePath));
        mockConfigContent = Buffer.from(raw).toString('utf-8');
      } catch {
        // No mock config exists yet - that's fine, skip copying
        this.outputChannel.appendLine(`No mock config found at ${mockFile}, skipping copy`);
        return;
      }

      // Clean out the proxy directory before copying to remove stale files,
      // then recreate it ready for the new set of files
      try {
        await vscode.workspace.fs.delete(vscode.Uri.file(proxyDir), { recursive: true });
      } catch {
        // Directory didn't exist yet — that's fine
      }
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(proxyDir));

      // Parse the mock config to extract bodyFile references
      let mockConfig: any;
      try {
        mockConfig = JSON.parse(mockConfigContent);
      } catch (error: unknown) {
        this.log.warn('Failed to parse mock config:', error);
        this.outputChannel.appendLine(
          `WARNING: Failed to parse mock config: ${getErrorMessage(error)}`,
        );
        return;
      }

      // Track copied files and their new names to avoid duplicates
      const copiedFiles = new Map<string, string>(); // source path -> dest filename
      const usedNames = new Set<string>();

      // Process each rule and copy its bodyFile if present
      if (mockConfig.rules && Array.isArray(mockConfig.rules)) {
        for (const rule of mockConfig.rules) {
          if (rule.response?.bodyFile) {
            const bodyFilePath = rule.response.bodyFile;

            // Reject absolute paths — bodyFile must be relative to the workspace
            if (path.isAbsolute(bodyFilePath)) {
              this.log.warn(`Skipping bodyFile with absolute path: ${bodyFilePath}`);
              this.outputChannel.appendLine(
                `WARNING: Skipping bodyFile with absolute path (must be relative to workspace): ${bodyFilePath}`,
              );
              delete rule.response.bodyFile;
              continue;
            }

            // Resolve and validate that the path stays within the workspace root
            const bodyFileSourcePath = path.resolve(this.workspacePath, bodyFilePath);
            if (
              !bodyFileSourcePath.startsWith(this.workspacePath + path.sep) &&
              bodyFileSourcePath !== this.workspacePath
            ) {
              this.log.warn(`Skipping bodyFile outside workspace: ${bodyFilePath}`);
              this.outputChannel.appendLine(
                `WARNING: Skipping bodyFile that resolves outside workspace root: ${bodyFilePath}`,
              );
              delete rule.response.bodyFile;
              continue;
            }

            // Check if file exists
            try {
              await vscode.workspace.fs.stat(vscode.Uri.file(bodyFileSourcePath));
            } catch {
              this.log.warn(`Body file not found: ${bodyFilePath}`);
              this.outputChannel.appendLine(
                `WARNING: Body file not found: ${bodyFilePath} (resolved to: ${bodyFileSourcePath})`,
              );
              continue;
            }

            // Check if we've already copied this file
            if (copiedFiles.has(bodyFileSourcePath)) {
              rule.response.bodyFile = copiedFiles.get(bodyFileSourcePath);
              continue;
            }

            // Generate a unique filename
            const originalName = path.basename(bodyFilePath);
            let uniqueName = originalName;
            let counter = 1;
            while (usedNames.has(uniqueName)) {
              const ext = path.extname(originalName);
              const base = path.basename(originalName, ext);
              uniqueName = `${base}-${counter}${ext}`;
              counter++;
            }
            usedNames.add(uniqueName);

            // Copy the body file
            try {
              const bodyFileDestPath = path.join(proxyDir, uniqueName);
              await vscode.workspace.fs.copy(
                vscode.Uri.file(bodyFileSourcePath),
                vscode.Uri.file(bodyFileDestPath),
                { overwrite: true },
              );

              copiedFiles.set(bodyFileSourcePath, uniqueName);
              rule.response.bodyFile = uniqueName;
            } catch (error: unknown) {
              this.log.warn(`Failed to copy body file ${bodyFilePath}:`, error);
              this.outputChannel.appendLine(
                `WARNING: Failed to copy body file ${bodyFilePath}: ${getErrorMessage(error)}`,
              );
              // Leave the bodyFile reference as-is if copy fails
            }
          }
        }
      }

      // Write the updated mock config to the fixed location
      await vscode.workspace.fs.writeFile(
        vscode.Uri.file(mockDestPath),
        Buffer.from(JSON.stringify(mockConfig, null, 2), 'utf-8'),
      );

      this.outputChannel.appendLine(
        `✓ Copied mock config to proxy/api-mocks.json (${copiedFiles.size} body files)`,
      );
    } catch (error: unknown) {
      this.log.warn('Failed to copy mock files:', error);
      this.outputChannel.appendLine(
        `WARNING: Failed to copy mock files: ${getErrorMessage(error)}`,
      );
      // Don't throw - allow server to start even if mock copying fails
    }
  }

  /**
   * Builds a Storybook theme that uses Peacock extension colors for all accent/bar surfaces
   * and falls back to the extracted VS Code CSS var colors for everything else.
   *
   * Peacock applies its brand color to the title bar, activity bar, and status bar via
   * workbench.colorCustomizations. We map those surfaces to the analogous Storybook regions:
   *   titleBar.*       → bar (top toolbar strip)
   *   activityBar.*    → hover + button surface tints
   *   titleBar.active* → colorSecondary (selected story row fill) + textInverseColor
   *
   * If the workspace has no Peacock color customizations, falls back to matchVsCode behavior.
   */
  private buildPeacockTheme(): Record<string, unknown> {
    const colorCustomizations = vscode.workspace
      .getConfiguration('workbench')
      .get<Record<string, string>>('colorCustomizations', {});

    const pColorSecondary = colorCustomizations['titleBar.activeBackground'];

    // No peacock settings found — fall back to the standard VS Code CSS var mapping
    if (!pColorSecondary) {
      return this.pendingThemeColors
        ? { ...this.pendingThemeColors, appBorderRadius: 4, inputBorderRadius: 2 }
        : {};
    }

    const ptextInverseColor = colorCustomizations['titleBar.activeForeground'];
    const pbarTextColor = colorCustomizations['titleBar.activeForeground'];
    const pvarHoverColor = colorCustomizations['titleBar.inactiveForeground'];
    const pbuttonBg = colorCustomizations['titleBar.inactiveBackground'];

    // Base CSS vars provide the non-accent fields (app shell, inputs, typography)
    const base: Partial<IStorybookThemeColors> = this.pendingThemeColors ?? {};

    return {
      ...base,
      appBorderRadius: 4,
      inputBorderRadius: 2,
      // Selected story row fill → main peacock brand color
      colorSecondary: pColorSecondary,
      // Text rendered on top of brand-colored surfaces
      textInverseColor: ptextInverseColor ?? base.textInverseColor,
      // Top toolbar strip mirrors the title bar
      barBg: pColorSecondary,
      barTextColor: pbarTextColor ?? base.barTextColor,
      barSelectedColor: ptextInverseColor ?? base.barSelectedColor,
      // Hover/button tints use the slightly lighter activity bar variant
      barHoverColor: pvarHoverColor ?? base.barHoverColor,
      buttonBg: pbuttonBg ?? base.buttonBg,
    };
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
    const managerTs = path.join(configDir, 'manager.ts');

    // Create .storybook directory
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(configDir));

    // Read template files from the extension
    const mainConfig = await this.readTemplateFile('main.ts');
    const managerConfig = await this.readTemplateFile('manager.ts');

    await vscode.workspace.fs.writeFile(vscode.Uri.file(mainTs), Buffer.from(mainConfig, 'utf-8'));
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(managerTs),
      Buffer.from(managerConfig, 'utf-8'),
    );

    // preview.ts is written by updatePreviewGlobals(), which also runs unconditionally
    // on every subsequent start, so globals are always fresh.
    await this.updatePreviewGlobals();

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
   * Create package.json in temp/storybook directory from template.
   *
   * The template contains a `{{ADDON_REF}}` placeholder for the addon version.
   * In development (ExtensionMode.Development / Test) the extension's local
   * packages/ directory is used via a `file:` reference so that edits to the
   * addon source are reflected without republishing anything.
   * In production (ExtensionMode.Production) the published npm version is used.
   *
   * TODO: update the production version string below before each marketplace release.
   */
  private async createPackageJson(): Promise<void> {
    // Ensure temp/storybook directory exists
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(this.storybookDir));

    let addonRef: string;
    if (this.extensionMode === vscode.ExtensionMode.Production) {
      // Installed from the marketplace — resolve the addon from the npm registry.
      addonRef = '^0.0.1'; // TODO: update to the published version before each release
    } else {
      // Running from source (F5 launch or extension tests) — link directly to the
      // local packages/ directory so changes are reflected without republishing.
      const addonLocalPath = path.join(
        this.extensionUri.fsPath,
        'packages',
        'storybook-addon-spfx',
      );
      addonRef = `file:${path.relative(this.storybookDir, addonLocalPath).replace(/\\/g, '/')}`;
    }

    const packageJsonContent = (await this.readTemplateFile('package.json')).replace(
      '{{ADDON_REF}}',
      addonRef,
    );

    const packageJsonPath = path.join(this.storybookDir, 'package.json');
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(packageJsonPath),
      Buffer.from(packageJsonContent, 'utf-8'),
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

    // All dependencies (including the addon reference) are declared in package.json
    // by createPackageJson(), so a single npm install resolves everything in one pass.
    await this.runNpmInstall();

    this.outputChannel.appendLine('✓ Storybook dependencies installed');
  }

  /**
   * Run npm install in the temp/storybook directory
   */
  private async runNpmInstall(): Promise<void> {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
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
