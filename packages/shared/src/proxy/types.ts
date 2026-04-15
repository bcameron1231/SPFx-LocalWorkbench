// API Proxy Types
//
// Type definitions for the API proxy/mock system that intercepts
// SPFx HTTP client calls and returns configurable mock responses.

/** Client type identifier for matching rules */
export type ApiClientType = 'spHttp' | 'http' | 'aadHttp' | 'fetch';

/** Serialized API request */
export interface IProxyRequest {
  /** Unique correlation ID for async response matching */
  id: string;

  /** The request URL */
  url: string;

  /** HTTP method */
  method: string;

  /** Request headers */
  headers?: Record<string, string>;

  /** Serialized request body */
  body?: string;

  /** Which SPFx client originated the call */
  clientType: ApiClientType;
}

/** Serialized API response */
export interface IProxyResponse {
  /** Correlation ID matching the request */
  id: string;

  /** HTTP status code */
  status: number;

  /** Response headers */
  headers: Record<string, string>;

  /** Serialized response body */
  body: string;

  /** Whether this response matched a mock rule */
  matched: boolean;
}

/** Request matching criteria */
export interface IMockRuleMatch {
  /** URL pattern to match (substring or glob when urlPattern is true) */
  url: string;

  /** HTTP method to match (GET, POST, etc.). If omitted, matches any method. */
  method?: string;

  /** Only match calls from a specific client type */
  clientType?: ApiClientType;

  /** When true, the url field is treated as a glob pattern */
  urlPattern?: boolean;
}

/** Base properties shared by all mock response variants */
interface IMockRuleResponseBase {
  /** HTTP status code to return */
  status: number;

  /** Response headers */
  headers?: Record<string, string>;

  /** Simulated delay in milliseconds before returning the response */
  delay?: number;
}

/**
 * The mock response definition.
 * Uses a discriminated union so that `body` and `bodyFile` are mutually exclusive.
 */
export type IMockRuleResponse = IMockRuleResponseBase &
  (
    | { body?: unknown; bodyFile?: never }
    | { body?: never; bodyFile?: string }
    | { body?: never; bodyFile?: never }
  );

/** A single mock rule that maps a request pattern to a response */
export interface IMockRule {
  /** Pattern to match incoming requests */
  match: IMockRuleMatch;

  /** The response to return when matched */
  response: IMockRuleResponse;

  /** Optional friendly name for the rule (used in logs and diagnostics) */
  name?: string;

  /** When true, the rule is skipped during matching */
  disabled?: boolean;
}

/** Top-level mock configuration file structure (.spfx-workbench/api-mocks.json) */
export interface IMockConfig {
  /** Global default delay in milliseconds */
  delay?: number;

  /** Mock rules evaluated in order; first match wins */
  rules: IMockRule[];
}

/** Story-level proxy configuration parameters */
export interface ISpfxProxyParameters {
  /** Disable proxy for this story (uses stub responses) */
  disabled?: boolean;
  
  /** Path to alternate mock config file (relative to mock-data folder) */
  mockFile?: string;
  
  /** Inline mock configuration (overrides file-based config) */
  config?: IMockConfig;
}
