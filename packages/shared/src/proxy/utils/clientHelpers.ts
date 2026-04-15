/**
 * HTTP Client Helpers
 *
 * Shared utilities for HTTP client implementations (proxy and passthrough).
 */

/**
 * Extracts body and headers from SPFx-style options object.
 * Handles both string and object bodies (auto-serializes objects to JSON).
 */
export function extractOptions(options?: any): { body?: string; headers?: Record<string, string> } {
  const body = options?.body
    ? typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body)
    : undefined;
  const headers = options?.headers;
  return { body, headers };
}
