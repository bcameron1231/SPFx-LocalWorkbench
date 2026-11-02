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
  const headers = normalizeHeaders(options?.headers);
  return { body, headers };
}

/**
 * Converts any HeadersInit (Headers instance, [key, value] pairs or a plain object) to a plain
 * object. Requests are posted to the extension host, and a Headers instance cannot be cloned.
 */
export function normalizeHeaders(headers?: any): Record<string, string> | undefined {
  if (!headers) {
    return undefined;
  }
  const result: Record<string, string> = {};
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      result[String(key)] = String(value);
    }
    return result;
  }
  if (typeof headers.forEach === 'function' && typeof headers.get === 'function') {
    // Headers-like object from another realm (e.g. a polyfill bundled by the web part)
    headers.forEach((value: string, key: string) => {
      result[key] = value;
    });
    return result;
  }
  for (const key of Object.keys(headers)) {
    result[key] = String(headers[key]);
  }
  return result;
}
