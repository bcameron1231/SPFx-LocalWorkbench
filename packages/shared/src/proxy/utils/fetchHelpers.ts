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
 * Serializes a fetch body to a string.
 * Handles strings, ArrayBuffer/Uint8Array (decoded as UTF-8), and Blob (async).
 * URLSearchParams and FormData fall back to toString() — sufficient for
 * matching purposes since SharePoint REST API calls always use JSON strings.
 * Note: Do NOT pass Request.body (a ReadableStream) here — use
 * input.clone().text() in the caller to avoid consuming the original stream.
 */
export async function serializeBody(raw: BodyInit | null | undefined): Promise<string | undefined> {
  // eslint-disable-next-line eqeqeq -- nullish check for both null and undefined
  if (raw == null) {
    return undefined;
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (raw instanceof ArrayBuffer || raw instanceof Uint8Array) {
    return new TextDecoder().decode(raw);
  }
  if (raw instanceof Blob) {
    return await raw.text();
  }
  // URLSearchParams, FormData – best effort (not used in SharePoint REST calls)
  return raw.toString();
}
