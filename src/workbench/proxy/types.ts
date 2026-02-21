// API Proxy Types
//
// Type definitions for the API proxy/mock system that intercepts
// SPFx HTTP client calls and returns configurable mock responses.

// The proxy operating mode
export type ProxyMode = 'mock';

// Client type identifier for matching rules
export type ApiClientType = 'spHttp' | 'http' | 'aadHttp' | 'fetch';

// A single mock rule that maps a request pattern to a response
export interface IMockRule {
    // Pattern to match incoming requests
    match: IMockRuleMatch;
    // The response to return when matched
    response: IMockRuleResponse;
}

// Request matching criteria
export interface IMockRuleMatch {
    // URL pattern to match (substring or glob when urlPattern is true)
    url: string;
    // HTTP method to match (GET, POST, etc.). If omitted, matches any method.
    method?: string;
    // Only match calls from a specific client type
    clientType?: ApiClientType;
    // When true, the url field is treated as a glob pattern
    urlPattern?: boolean;
}

// The mock response definition
export interface IMockRuleResponse {
    // HTTP status code to return
    status: number;
    // Response headers
    headers?: Record<string, string>;
    // Inline response body (used when bodyFile is not set)
    body?: unknown;
    // Path to a JSON file containing the response body (relative to workspace)
    bodyFile?: string;
    // Simulated delay in milliseconds before returning the response
    delay?: number;
}

// Top-level mock configuration file structure (.spfx-workbench/api-mocks.json)
export interface IMockConfig {
    // Global default delay in milliseconds
    delay?: number;
    // Mock rules evaluated in order; first match wins
    rules: IMockRule[];
}

// Serialized API request sent from webview to extension host
export interface IProxyRequest {
    // Unique correlation ID for async response matching
    id: string;
    // The request URL
    url: string;
    // HTTP method
    method: string;
    // Request headers
    headers?: Record<string, string>;
    // Serialized request body
    body?: string;
    // Which SPFx client originated the call
    clientType: ApiClientType;
}

// Serialized API response sent from extension host back to webview
export interface IProxyResponse {
    // Correlation ID matching the original request
    id: string;
    // HTTP status code
    status: number;
    // Response headers
    headers: Record<string, string>;
    // Serialized response body
    body: string;
    // Whether a mock rule was matched (vs. fallback)
    matched: boolean;
}

// VS Code settings for proxy behavior
export interface IProxySettings {
    // Whether the API proxy system is enabled
    enabled: boolean;
    // Path to the mock configuration file relative to workspace
    mockFile: string;
    // Default delay in ms when not specified by a rule
    defaultDelay: number;
    // HTTP status to return when no rule matches
    fallbackStatus: number;
    // Whether to log all proxied requests to the output channel
    logRequests: boolean;
}
