/**
 * Fetch Interception Helpers
 *
 * Shared utilities for extracting headers and serializing bodies from fetch() calls.
 * Used by both workbench (VsCodeProxyTransport) and Storybook (BrowserProxyTransport).
 */

/**
 * Extract headers from various HeadersInit formats into a plain object
 */
export function extractHeaders(raw: HeadersInit | undefined): Record<string, string> | undefined {
  if (!raw) {
    return undefined;
  }
  const headers: Record<string, string> = {};
  if (raw instanceof Headers) {
    raw.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(raw)) {
    for (const [key, value] of raw) {
      headers[key] = value;
    }
  } else {
    return raw as Record<string, string>;
  }
  return headers;
}

/**
 * Best-effort serialization of a fetch body to a string.
 * Handles the most common cases (string, ArrayBuffer, Uint8Array, ReadableStream).
 */
export function serializeBody(raw: BodyInit | null | undefined): string | undefined {
  // eslint-disable-next-line eqeqeq -- nullish check for both null and undefined
  if (raw == null) {
    return undefined;
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (raw instanceof ArrayBuffer) {
    return new TextDecoder().decode(raw);
  }
  if (raw instanceof Uint8Array) {
    return new TextDecoder().decode(raw);
  }
  // URLSearchParams, FormData, Blob, ReadableStream – best effort
  if (typeof raw.toString === 'function') {
    return raw.toString();
  }
  return String(raw);
}
