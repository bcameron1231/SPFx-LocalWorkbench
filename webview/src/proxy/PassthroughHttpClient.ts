/**
 * Passthrough HttpClient
 *
 * A simple HTTP client that makes real fetch() calls instead of routing through the proxy.
 * Used when the API proxy is disabled, allowing external tools like Dev Proxy to intercept
 * network traffic.
 */
import { MockProxyResponse, extractOptions } from '@spfx-local-workbench/shared';

/**
 * HTTP client that delegates directly to the browser's fetch() API.
 * Mirrors the SPFx HttpClient / SPHttpClient interface so web parts
 * work without code changes, but actual network requests are made.
 */
export class PassthroughHttpClient {
  static configurations = { v1: {} };

  async get(url: string, _config?: any): Promise<MockProxyResponse> {
    return this._send(url, 'GET');
  }

  async post(url: string, _config?: any, options?: any): Promise<MockProxyResponse> {
    const { body, headers } = extractOptions(options);
    return this._send(url, 'POST', headers, body);
  }

  async put(url: string, _config?: any, options?: any): Promise<MockProxyResponse> {
    const { body, headers } = extractOptions(options);
    return this._send(url, 'PUT', headers, body);
  }

  async patch(url: string, _config?: any, options?: any): Promise<MockProxyResponse> {
    const { body, headers } = extractOptions(options);
    return this._send(url, 'PATCH', headers, body);
  }

  async delete(url: string, _config?: any, options?: any): Promise<MockProxyResponse> {
    const { body, headers } = extractOptions(options);
    return this._send(url, 'DELETE', headers, body);
  }

  async head(url: string, _config?: any): Promise<MockProxyResponse> {
    return this._send(url, 'HEAD');
  }

  async options(url: string, _config?: any): Promise<MockProxyResponse> {
    return this._send(url, 'OPTIONS');
  }

  async fetch(url: string, _config?: any, options?: any): Promise<MockProxyResponse> {
    const method = options?.method || 'GET';
    const { body, headers } = extractOptions(options);
    return this._send(url, method, headers, body);
  }

  protected async _send(
    url: string,
    method: string,
    headers?: Record<string, string>,
    body?: string,
  ): Promise<MockProxyResponse> {
    try {
      const response = await window.fetch(url, {
        method,
        headers,
        body,
      });

      const text = await response.text();

      // Collect response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return new MockProxyResponse(response.status, text, responseHeaders);
    } catch (err: unknown) {
      // Network error — return a synthetic 0-status response so the
      // web part code path mirrors what SPHttpClient would surface
      const message = err instanceof Error ? err.message : String(err);
      return new MockProxyResponse(0, JSON.stringify({ error: message }), {});
    }
  }
}
