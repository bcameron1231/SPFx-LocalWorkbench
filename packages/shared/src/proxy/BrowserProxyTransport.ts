/**
 * Browser Proxy Transport
 *
 * Browser-compatible implementation of IProxyTransport that uses MockRuleEngine
 * to serve mock responses from a local configuration file. Designed for use in
 * Storybook where there's no VS Code extension host to communicate with.
 */
import type { IProxyTransport } from './IProxyTransport';
import { MockRuleEngine } from './MockRuleEngine';
import {
  BASE_SCENARIO_LABEL,
  composeMockRules,
  getProxyScenarioSummaries,
  validateMockConfig,
} from './scenarios';
import type { IProxyScenarioSummary } from './scenarios';
import type { IMockConfig, IMockRule, IProxyRequest, IProxyResponse } from './types';

/** Default location for mock config in Storybook static directory */
const DEFAULT_MOCK_CONFIG_URL = '/proxy/api-mocks.json';

/** Default location for body files in Storybook static directory */
const DEFAULT_BODY_FILE_BASE_URL = '/proxy/';

/**
 * Transport that serves mock responses using MockRuleEngine with fetch-based file loading.
 * Used in Storybook to provide API mocking without a VS Code connection.
 */
export class BrowserProxyTransport implements IProxyTransport {
  private _ruleEngine: MockRuleEngine;
  private _initialized = false;
  private _mockConfigUrl: string;
  private _bodyFileBaseUrl: string;
  private _mode: 'mock' | 'mock-passthrough';
  private _config: IMockConfig | undefined;
  private _activeScenarioName: string | undefined;
  /** Original window.fetch captured before the interceptor is installed, for passthrough calls */
  private _passthroughFetch: typeof window.fetch;

  /**
   * Create a new BrowserProxyTransport
   * @param mockConfigUrl URL to fetch the mock configuration from (default: /proxy/api-mocks.json)
   * @param bodyFileBaseUrl Base URL for body files (default: /proxy/)
   * @param fallbackStatus HTTP status returned when no rule matches (default: 404)
   * @param mode 'mock' returns fallback for unmatched; 'mock-passthrough' calls real network (default: 'mock')
   * @param scenarioName Initial additive scenario name; undefined uses Base rules
   */
  constructor(
    mockConfigUrl?: string,
    bodyFileBaseUrl?: string,
    fallbackStatus?: number,
    mode?: 'mock' | 'mock-passthrough',
    scenarioName?: string,
  ) {
    this._mockConfigUrl = mockConfigUrl || DEFAULT_MOCK_CONFIG_URL;
    this._bodyFileBaseUrl = bodyFileBaseUrl || DEFAULT_BODY_FILE_BASE_URL;
    this._mode = mode ?? 'mock';
    this._activeScenarioName = scenarioName;
    // Capture window.fetch now, before installFetchInterceptor replaces it
    this._passthroughFetch = window.fetch.bind(window);

    // Create body file loader that uses fetch
    const bodyFileLoader = async (filename: string): Promise<string> => {
      // Reject absolute paths and path traversal segments (e.g. `..`) — these
      // could reach files outside the /proxy/ static directory on the dev server.
      // Split on both / and \ to catch Windows-style traversal as well.
      const segments = filename.split(/[/\\]/);
      if (filename.startsWith('/') || segments.some((seg) => seg === '..')) {
        console.warn(`[BrowserProxyTransport] Skipping bodyFile with unsafe path: ${filename}`);
        throw new Error(`Unsafe bodyFile path: ${filename}`);
      }

      const url = `${this._bodyFileBaseUrl}${filename}`;
      try {
        const response = await this._passthroughFetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.text();
      } catch (error) {
        console.warn(`[BrowserProxyTransport] Failed to load body file ${filename}:`, error);
        throw error;
      }
    };

    this._ruleEngine = new MockRuleEngine(bodyFileLoader);
    if (fallbackStatus !== undefined) {
      this._ruleEngine.setFallbackStatus(fallbackStatus);
    }
  }

  /**
   * Initialize the transport by loading the mock configuration
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      console.log('[BrowserProxyTransport] Already initialized');
      return;
    }

    try {
      const response = await this._passthroughFetch(this._mockConfigUrl);
      if (!response.ok) {
        console.warn(
          `[BrowserProxyTransport] Failed to load mock config from ${this._mockConfigUrl}: HTTP ${response.status}`,
        );
        // Initialize with empty config - requests will return empty responses
        this._config = undefined;
        this._ruleEngine.setConfig({ rules: [] });
        this._initialized = true;
        return;
      }

      const config = validateMockConfig(await response.json());
      this._config = config;
      this._applyScenario();
      this._initialized = true;

      console.log(
        `[BrowserProxyTransport] Loaded ${this._ruleEngine.getRules().length} effective mock rule(s) for ${
          this._activeScenarioName ?? BASE_SCENARIO_LABEL
        } from ${this._mockConfigUrl}`,
      );
    } catch (error) {
      console.warn(`[BrowserProxyTransport] Failed to initialize:`, error);
      // Initialize with empty config so requests don't fail
      this._config = undefined;
      this._ruleEngine.setConfig({ rules: [] });
      this._initialized = true;
    }
  }

  /**
   * Send an API request through the transport
   * @param request Serialized API request
   * @returns Promise resolving to the mock response
   */
  async sendRequest(request: IProxyRequest): Promise<IProxyResponse> {
    // Auto-initialize if not already done
    if (!this._initialized) {
      await this.initialize();
    }

    const response = await this._ruleEngine.processRequest(request);

    // In mock-passthrough mode, pass unmatched requests to the real network
    if (!response.matched && this._mode === 'mock-passthrough') {
      try {
        const fetchResponse = await this._passthroughFetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        const body = await fetchResponse.text();
        const headers: Record<string, string> = {};
        fetchResponse.headers.forEach((v, k) => {
          headers[k] = v;
        });
        return { id: request.id, status: fetchResponse.status, headers, body, matched: false };
      } catch (err) {
        console.warn(
          '[BrowserProxyTransport] Passthrough request failed, returning fallback:',
          err,
        );
      }
    }

    return response;
  }

  /**
   * Reload the mock configuration (useful for development/testing)
   */
  async reload(): Promise<void> {
    this._initialized = false;
    await this.initialize();
  }

  /**
   * Selects Base rules or a named scenario without replacing the transport.
   * Unknown names fall back to Base rules.
   */
  setScenario(scenarioName?: string): string | undefined {
    this._activeScenarioName = scenarioName;
    if (this._config) {
      this._applyScenario();
    }
    return this._activeScenarioName;
  }

  /** Returns the resolved scenario name; undefined represents Base rules. */
  getActiveScenarioName(): string | undefined {
    return this._activeScenarioName;
  }

  /** Returns picker summaries for the loaded configuration. */
  getScenarioSummaries(): IProxyScenarioSummary[] {
    return this._config ? getProxyScenarioSummaries(this._config) : [];
  }

  /**
   * Get the current mock rules (for diagnostics)
   */
  getRules(): readonly IMockRule[] {
    return this._ruleEngine.getRules();
  }

  private _applyScenario(): void {
    if (!this._config) {
      this._activeScenarioName = undefined;
      this._ruleEngine.setConfig({ rules: [] });
      return;
    }

    const composed = composeMockRules(this._config, this._activeScenarioName);
    if (!composed.requestedScenarioFound) {
      console.warn(
        `[BrowserProxyTransport] Scenario "${this._activeScenarioName}" was not found; using ${BASE_SCENARIO_LABEL}`,
      );
      this._activeScenarioName = undefined;
    }
    this._ruleEngine.setConfig({ ...this._config, rules: composed.rules });
  }
}
