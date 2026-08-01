// API Proxy Service
//
// Extension-host service that receives serialized API requests from the webview,
// matches them against mock rules, and returns mock responses.
// Handles loading/watching the mock config file and reading mock body files.
import * as path from 'path';
import * as vscode from 'vscode';

import {
  BASE_SCENARIO_LABEL,
  MockConfigValidationError,
  MockRuleEngine,
  composeMockRules,
  getProxyScenario,
  getProxyScenarioSummaries,
  validateMockConfig,
} from '@spfx-local-workbench/shared';

import type { IRecordedRequest } from './MockConfigGenerator';
import { createMockConfigScaffold } from './mockConfigScaffold';
import type {
  IMockConfig,
  IProxyRequest,
  IProxyResponse,
  IProxyScenarioState,
  IProxySettings,
  ProxyMode,
} from './types';

const DEFAULT_MOCK_FILE = '.spfx-workbench/api-mocks.json';
const DEFAULT_FALLBACK_STATUS = 404;

const defaultProxySettings: IProxySettings = {
  enabled: true,
  activeMode: {
    mode: 'mock',
    options: {
      mockFile: DEFAULT_MOCK_FILE,
      defaultDelay: 0,
      fallbackStatus: DEFAULT_FALLBACK_STATUS,
    },
  },
  logRequests: true,
};

export class ApiProxyService implements vscode.Disposable {
  private readonly _ruleEngine: MockRuleEngine;
  private readonly _disposables: vscode.Disposable[] = [];
  private readonly _outputChannel: vscode.OutputChannel;
  private readonly _workspaceRoot: string;
  private readonly _scenarioStateEmitter = new vscode.EventEmitter<IProxyScenarioState>();

  private _config: IMockConfig | undefined;
  private _settings: IProxySettings;
  private _configWatcher: vscode.FileSystemWatcher | undefined;
  private _recordedRequests: IRecordedRequest[] = [];
  private _activeScenarioName: string | undefined;
  private _recordingScenarioName: string | undefined;

  /** Fires whenever scenario options, selection, or proxy activity changes. */
  public readonly onDidChangeScenarioState = this._scenarioStateEmitter.event;

  constructor(workspaceRoot: string, outputChannel?: vscode.OutputChannel) {
    this._workspaceRoot = workspaceRoot;
    this._settings = ApiProxyService.readSettings();
    this._activeScenarioName = ApiProxyService.readActiveScenarioName();

    // Create body file loader for MockRuleEngine (reads files from workspace)
    const bodyFileLoader = async (relativePath: string): Promise<string> => {
      // Reject absolute paths
      if (path.isAbsolute(relativePath)) {
        this._log(`Warning: Skipping bodyFile with absolute path: ${relativePath}`);
        throw new Error(`Mock body file must be relative to workspace: ${relativePath}`);
      }

      // Resolve and validate that the path stays within the workspace root
      const filePath = path.resolve(this._workspaceRoot, relativePath);
      const workspacePrefix = this._workspaceRoot + path.sep;
      if (!filePath.startsWith(workspacePrefix) && filePath !== this._workspaceRoot) {
        this._log(`Warning: Skipping bodyFile outside workspace root: ${relativePath}`);
        throw new Error(`Mock body file resolves outside workspace root: ${relativePath}`);
      }

      try {
        const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
        return Buffer.from(raw).toString('utf-8');
      } catch (error) {
        this._log(`Warning: Could not read body file: ${relativePath}`);
        throw new Error(`Mock body file not found: ${relativePath}`);
      }
    };

    // Initialize MockRuleEngine with body file loader
    this._ruleEngine = new MockRuleEngine(bodyFileLoader);

    // If no output channel provided, create one and add to disposables
    if (outputChannel) {
      this._outputChannel = outputChannel;
    } else {
      this._outputChannel = vscode.window.createOutputChannel('SPFx API Proxy');
      this._disposables.push(this._outputChannel);
    }

    // Load initial config
    this._loadConfig();

    // Watch for config file changes
    this._setupConfigWatcher();

    // Watch for settings changes
    this._disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('spfxLocalWorkbench.proxy')) {
          const previousMockFile = this._mockFile;
          const wasRecording = this.isRecording;
          const recordingMode = this._settings.activeMode;
          const configuredScenarioName = ApiProxyService.readActiveScenarioName();
          this._settings = ApiProxyService.readSettings();
          if (wasRecording) {
            // Recording pins both matching mode and scenario for the full capture.
            this._settings = { ...this._settings, activeMode: recordingMode };
            if (configuredScenarioName !== this._recordingScenarioName) {
              void vscode.workspace
                .getConfiguration('spfxLocalWorkbench.proxy')
                .update(
                  'activeScenario',
                  this._recordingScenarioName,
                  vscode.ConfigurationTarget.Workspace,
                );
            }
          } else {
            this._activeScenarioName = configuredScenarioName;
          }
          this._log('Proxy settings updated');
          if (previousMockFile !== this._mockFile) {
            this._setupConfigWatcher();
          }
          this._loadConfig();
        }
      }),
    );
  }

  // Read proxy settings from VS Code configuration
  static readSettings(): IProxySettings {
    const config = vscode.workspace.getConfiguration('spfxLocalWorkbench.proxy');
    const mode = config.get<ProxyMode>('mode', defaultProxySettings.activeMode.mode);
    const mockFile = config.get<string>('mockFile', DEFAULT_MOCK_FILE);
    const fallbackStatus = config.get<number>('fallbackStatus', DEFAULT_FALLBACK_STATUS);

    const activeMode = ((): IProxySettings['activeMode'] => {
      switch (mode) {
        case 'passthrough':
          return { mode, options: { allowedOrigins: config.get<string[]>('allowedOrigins') } };
        case 'record':
          return {
            mode,
            options: {
              mockFile,
              fallbackStatus,
              serveMocksWhileRecording: config.get<boolean>('serveMocksWhileRecording', true),
            },
          };
        case 'mock-passthrough':
          return {
            mode: 'mock-passthrough',
            options: {
              mockFile,
              defaultDelay: config.get<number>('defaultDelay', 0),
              fallbackStatus,
            },
          };
        case 'mock':
        default:
          return {
            mode: 'mock',
            options: {
              mockFile,
              defaultDelay: config.get<number>('defaultDelay', 0),
              fallbackStatus,
            },
          };
      }
    })();

    return {
      enabled: config.get<boolean>('enabled', defaultProxySettings.enabled),
      activeMode,
      logRequests: config.get<boolean>('logRequests', defaultProxySettings.logRequests),
    };
  }

  /** Reads the explicitly selected scenario; undefined represents Base rules. */
  static readActiveScenarioName(): string | undefined {
    const scenarioName = vscode.workspace
      .getConfiguration('spfxLocalWorkbench.proxy')
      .get<string>('activeScenario');
    return scenarioName === '' ? undefined : scenarioName;
  }

  get mode(): ProxyMode {
    return this._settings.activeMode.mode;
  }

  // Helpers to extract mode-specific options with safe fallbacks
  private get _mockFile(): string {
    const { activeMode } = this._settings;
    if (activeMode.mode === 'mock' || activeMode.mode === 'mock-passthrough') {
      return activeMode.options.mockFile;
    }
    if (activeMode.mode === 'record') {
      return activeMode.options.mockFile;
    }
    return DEFAULT_MOCK_FILE;
  }

  private get _defaultDelay(): number {
    const { activeMode } = this._settings;
    return activeMode.mode === 'mock' || activeMode.mode === 'mock-passthrough'
      ? activeMode.options.defaultDelay
      : 0;
  }

  private get _fallbackStatus(): number {
    const { activeMode } = this._settings;
    if (activeMode.mode === 'mock' || activeMode.mode === 'mock-passthrough') {
      return activeMode.options.fallbackStatus;
    }
    if (activeMode.mode === 'record') {
      return activeMode.options.fallbackStatus;
    }
    return DEFAULT_FALLBACK_STATUS;
  }

  // Whether the proxy is currently enabled
  get enabled(): boolean {
    return this._settings.enabled;
  }

  /** Whether the current proxy mode actively consults mock rules. */
  get scenariosActive(): boolean {
    const { activeMode } = this._settings;
    if (!this._settings.enabled || activeMode.mode === 'passthrough') {
      return false;
    }
    return !(
      activeMode.mode === 'record' && !activeMode.options.serveMocksWhileRecording
    );
  }

  /** Currently resolved scenario name; undefined represents Base rules. */
  get activeScenarioName(): string | undefined {
    return this._activeScenarioName;
  }

  /** Scenario pinned when recording began. */
  get recordingScenarioName(): string | undefined {
    return this._recordingScenarioName;
  }

  /** Compact scenario state safe to send to the webview. */
  getScenarioState(): IProxyScenarioState {
    return {
      activeScenarioName: this._activeScenarioName,
      summaries: this._config ? getProxyScenarioSummaries(this._config) : [],
      proxyActive: this.scenariosActive,
      recording: this.isRecording,
    };
  }

  /** Reloads and validates the mock file before an explicit follow-up action. */
  async reloadConfig(): Promise<void> {
    await this._loadConfig();
  }

  /**
   * Selects Base rules or a configured scenario and persists the workspace choice.
   * @param scenarioName Undefined selects Base rules
   */
  async setActiveScenario(scenarioName?: string): Promise<IProxyScenarioState> {
    if (this.isRecording) {
      throw new Error('Proxy scenarios cannot be switched while request recording is active.');
    }
    if (scenarioName && (!this._config || !getProxyScenario(this._config, scenarioName))) {
      // The selection may come directly from a generator completion action before
      // the file watcher has observed its write.
      await this._loadConfig();
      if (!this._config || !getProxyScenario(this._config, scenarioName)) {
        throw new Error(`Proxy scenario not found: ${scenarioName}`);
      }
    }

    const config = vscode.workspace.getConfiguration('spfxLocalWorkbench.proxy');
    await config.update(
      'activeScenario',
      scenarioName,
      vscode.ConfigurationTarget.Workspace,
    );

    this._activeScenarioName = scenarioName;
    this._applyCurrentConfig();
    this._log(`Active scenario: ${scenarioName ?? BASE_SCENARIO_LABEL}`);
    this._emitScenarioState();
    return this.getScenarioState();
  }

  // Handle an API request from the webview.
  // This is the main entry point called by WorkbenchPanel when it receives an 'apiRequest' message.
  async handleRequest(request: IProxyRequest): Promise<IProxyResponse> {
    this._log(
      `${request.method} ${request.url} [${request.clientType}] [${
        this._activeScenarioName ?? BASE_SCENARIO_LABEL
      }]`,
    );

    try {
      // In pure passthrough mode every request goes straight to the real network
      if (this._settings.activeMode.mode === 'passthrough') {
        this._log(`  Passthrough mode - forwarding to real network`);
        return {
          id: request.id,
          status: 0,
          headers: {},
          body: '',
          matched: false,
          passthrough: true,
        };
      }

      // In record mode without serveMocksWhileRecording, skip the mock engine and
      // always forward to the real network (the response will be captured for recording)
      if (
        this._settings.activeMode.mode === 'record' &&
        !this._settings.activeMode.options.serveMocksWhileRecording
      ) {
        this._log(`  Record mode (no mocks) - forwarding to real network`);
        this._recordedRequests.push({
          url: request.url,
          method: request.method,
          clientType: request.clientType,
          timestamp: Date.now(),
        });
        this._log(`  Recorded request (${this._recordedRequests.length} total)`);
        return {
          id: request.id,
          status: 0,
          headers: {},
          body: '',
          matched: false,
          passthrough: true,
        };
      }

      // Use MockRuleEngine to process the request
      // Match once up front so the result can be used for both logging and processing
      // without a second O(n) rule scan.
      const matchedRule = this._ruleEngine.match(request);
      const response = await this._ruleEngine.processRequest(request, matchedRule);

      if (response.matched) {
        this._log(`  Matched rule: ${matchedRule?.name || matchedRule?.match.url}`);
      } else {
        // In mock-passthrough mode, signal the webview to make the real network call
        if (this._settings.activeMode.mode === 'mock-passthrough') {
          this._log(`  No match - passing through to real network`);
          return { ...response, passthrough: true };
        }

        this._log(`  No match - fallback ${this._fallbackStatus}`);

        // Record unmatched requests when in record mode
        if (this._settings.activeMode.mode === 'record') {
          this._recordedRequests.push({
            url: request.url,
            method: request.method,
            clientType: request.clientType,
            timestamp: Date.now(),
          });
          this._log(`  Recorded unmatched request (${this._recordedRequests.length} total)`);
        }

        // Override the fallback status from settings
        return {
          ...response,
          status: this._fallbackStatus,
          body: JSON.stringify({
            error: 'No mock rule matched',
            url: request.url,
            method: request.method,
            clientType: request.clientType,
          }),
        };
      }

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this._log(`  Error: ${message}`);
      return {
        id: request.id,
        status: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: message }),
        matched: false,
      };
    }
  }

  // ── Config Loading ──────────────────────────────────────────────

  private async _loadConfig(): Promise<void> {
    const configPath = path.join(this._workspaceRoot, this._mockFile);

    try {
      const uri = vscode.Uri.file(configPath);
      const raw = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(raw).toString('utf-8');
      const parsed = JSON.parse(text) as unknown;
      const nextConfig = validateMockConfig(parsed);
      this._config = nextConfig;

      if (
        this._activeScenarioName &&
        !getProxyScenario(nextConfig, this._activeScenarioName)
      ) {
        const staleScenarioName = this._activeScenarioName;
        this._activeScenarioName = undefined;
        this._log(
          `Warning: Scenario "${staleScenarioName}" no longer exists; using ${BASE_SCENARIO_LABEL}`,
        );
        void vscode.workspace
          .getConfiguration('spfxLocalWorkbench.proxy')
          .update('activeScenario', undefined, vscode.ConfigurationTarget.Workspace);
      }

      this._applyCurrentConfig();
      const effectiveCount = this._ruleEngine.getRules().length;
      this._log(
        `Loaded ${effectiveCount} effective mock rule(s) for ${
          this._activeScenarioName ?? BASE_SCENARIO_LABEL
        } from ${this._mockFile}`,
      );
      this._emitScenarioState();
    } catch (error: unknown) {
      if (!this._isFileNotFound(error)) {
        const detail =
          error instanceof MockConfigValidationError
            ? error.message
            : error instanceof Error
              ? error.message
              : String(error);
        this._log(`Warning: Failed to load mock config from ${this._mockFile}: ${detail}`);
        if (this._config) {
          this._log('Keeping the last valid mock configuration');
          this._emitScenarioState();
          return;
        }
        this._config = undefined;
        this._ruleEngine.setRules([]);
        this._log('No valid mock configuration is available (using no rules)');
        this._emitScenarioState();
        return;
      }

      this._config = undefined;
      this._ruleEngine.setRules([]);
      this._log(`No mock config found at ${this._mockFile} (using defaults)`);
      this._emitScenarioState();
    }
  }

  private _setupConfigWatcher(): void {
    this._configWatcher?.dispose();
    this._configWatcher = undefined;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    // Watch the mock config file and all files in the mocks directory
    const configPattern = new vscode.RelativePattern(workspaceFolder, this._mockFile);
    this._configWatcher = vscode.workspace.createFileSystemWatcher(configPattern);

    const onChange = () => {
      this._log('Mock config changed, reloading...');
      this._loadConfig();
    };

    this._configWatcher.onDidChange(onChange);
    this._configWatcher.onDidCreate(onChange);
    this._configWatcher.onDidDelete(() => {
      this._config = undefined;
      this._ruleEngine.setRules([]);
      this._log('Mock config deleted');
      this._emitScenarioState();
    });
  }

  // ── Request Recording ────────────────────────────────────────────

  // Start capturing unmatched requests by switching to record mode.
  startRecording(): void {
    this._recordedRequests = [];
    this._recordingScenarioName = this._activeScenarioName;
    this._settings = {
      ...this._settings,
      activeMode: {
        mode: 'record',
        options: {
          mockFile: this._mockFile,
          fallbackStatus: this._fallbackStatus,
          serveMocksWhileRecording: true,
        },
      },
    };
    this._log(
      `Request recording started for ${this._recordingScenarioName ?? BASE_SCENARIO_LABEL}`,
    );
    this._emitScenarioState();
  }

  // Stop recording and return all captured requests (reverts to mock mode).
  stopRecording(): IRecordedRequest[] {
    const requests = [...this._recordedRequests];
    this._settings = ApiProxyService.readSettings();
    this._recordingScenarioName = undefined;
    this._log(`Request recording stopped (${requests.length} request(s) captured)`);
    this._emitScenarioState();
    return requests;
  }

  get isRecording(): boolean {
    return this._settings.activeMode.mode === 'record';
  }

  // Return the workspace root (needed by MockConfigGenerator).
  get workspaceRoot(): string {
    return this._workspaceRoot;
  }

  // Return the configured mock file path (needed by MockConfigGenerator).
  get mockFile(): string {
    return this._mockFile;
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private _log(message: string): void {
    if (this._settings.logRequests) {
      const timestamp = new Date().toISOString().substring(11, 23);
      this._outputChannel.appendLine(`[${timestamp}] ${message}`);
    }
  }

  private _applyCurrentConfig(): void {
    if (!this._config) {
      this._ruleEngine.setRules([]);
      return;
    }
    const composed = composeMockRules(this._config, this._activeScenarioName);
    this._ruleEngine.setConfig(
      { ...this._config, rules: composed.rules },
      this._defaultDelay,
    );
    this._ruleEngine.setFallbackStatus(this._fallbackStatus);
  }

  private _emitScenarioState(): void {
    this._scenarioStateEmitter.fire(this.getScenarioState());
  }

  private _isFileNotFound(error: unknown): boolean {
    return (
      error instanceof vscode.FileSystemError &&
      (error.code === 'FileNotFound' || /not found/i.test(error.message))
    );
  }

  /**
   * Initializes the mock configuration when it does not already exist.
   * @returns The configuration URI and whether a new file was created
   */
  async scaffoldMockConfig(): Promise<{ uri: vscode.Uri; created: boolean }> {
    const configPath = path.join(this._workspaceRoot, this._mockFile);
    const configUri = vscode.Uri.file(configPath);

    try {
      await vscode.workspace.fs.stat(configUri);
      return { uri: configUri, created: false };
    } catch {
      // File doesn't exist — create scaffold
    }

    const scaffold = createMockConfigScaffold();

    const configDir = path.dirname(configPath);
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(configDir));
    await vscode.workspace.fs.writeFile(
      configUri,
      Buffer.from(JSON.stringify(scaffold, null, 2), 'utf-8'),
    );

    this._log(`Scaffolded mock config at ${this._mockFile}`);
    await this._loadConfig();
    return { uri: configUri, created: true };
  }

  dispose(): void {
    this._configWatcher?.dispose();
    this._scenarioStateEmitter.dispose();
    for (const d of this._disposables) {
      d.dispose();
    }
  }
}
