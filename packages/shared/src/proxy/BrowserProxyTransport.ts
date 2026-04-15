/**
 * Browser Proxy Transport
 *
 * Browser-compatible implementation of IProxyTransport that uses MockRuleEngine
 * to serve mock responses from a local configuration file. Designed for use in
 * Storybook where there's no VS Code extension host to communicate with.
 */
import type { IProxyTransport } from './IProxyTransport';
import { MockRuleEngine } from './MockRuleEngine';
import type { IMockConfig, IProxyRequest, IProxyResponse } from './types';

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

  /**
   * Create a new BrowserProxyTransport
   * @param mockConfigUrl URL to fetch the mock configuration from (default: /proxy/api-mocks.json)
   * @param bodyFileBaseUrl Base URL for body files (default: /proxy/)
   */
  constructor(mockConfigUrl?: string, bodyFileBaseUrl?: string) {
    this._mockConfigUrl = mockConfigUrl || DEFAULT_MOCK_CONFIG_URL;
    this._bodyFileBaseUrl = bodyFileBaseUrl || DEFAULT_BODY_FILE_BASE_URL;

    // Create body file loader that uses fetch
    const bodyFileLoader = async (filename: string): Promise<string> => {
      // Reject absolute URL paths and path traversal segments — these could
      // reach files outside the /proxy/ static directory on the dev server
      if (filename.startsWith('/') || filename.includes('..')) {
        console.warn(`[BrowserProxyTransport] Skipping bodyFile with unsafe path: ${filename}`);
        throw new Error(`Unsafe bodyFile path: ${filename}`);
      }

      const url = `${this._bodyFileBaseUrl}${filename}`;
      try {
        const response = await fetch(url);
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
      const response = await fetch(this._mockConfigUrl);
      if (!response.ok) {
        console.warn(
          `[BrowserProxyTransport] Failed to load mock config from ${this._mockConfigUrl}: HTTP ${response.status}`,
        );
        // Initialize with empty config - requests will return empty responses
        this._ruleEngine.setConfig({ rules: [] });
        this._initialized = true;
        return;
      }

      const config: IMockConfig = await response.json();
      this._ruleEngine.setConfig(config);
      this._initialized = true;

      console.log(
        `[BrowserProxyTransport] Loaded ${config.rules?.length ?? 0} mock rules from ${this._mockConfigUrl}`,
      );
    } catch (error) {
      console.warn(`[BrowserProxyTransport] Failed to initialize:`, error);
      // Initialize with empty config so requests don't fail
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

    // Use MockRuleEngine to process the request
    return await this._ruleEngine.processRequest(request);
  }

  /**
   * Reload the mock configuration (useful for development/testing)
   */
  async reload(): Promise<void> {
    this._initialized = false;
    await this.initialize();
  }

  /**
   * Get the current mock rules (for diagnostics)
   */
  getRules(): readonly any[] {
    return this._ruleEngine.getRules();
  }
}
