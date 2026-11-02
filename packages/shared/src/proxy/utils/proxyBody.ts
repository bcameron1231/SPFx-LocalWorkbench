/**
 * Proxy body helpers
 *
 * Responses travel between the extension host and the webview as strings. Binary content
 * (images, files) is sent base64-encoded with bodyEncoding: 'base64'.
 */

/** Decodes a base64 string to bytes */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** The body as bytes for binary responses, or the string as it is */
export function decodeProxyBody(body: string, encoding?: 'base64'): Uint8Array | string {
  return encoding === 'base64' ? base64ToBytes(body) : body;
}
