/** Proxy HttpClient */
import type { IProxyTransport } from '../IProxyTransport';
import { MockProxyResponse } from '../MockProxyResponse';
import type { ApiClientType } from '../types';

/** Extracts body and headers from an SPFx-style options object. */
function extractOptions(options?: any): { body?: string; headers?: Record<string, string> } {
  const body = options?.body
    ? typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body)
    : undefined;
  const headers = options?.headers;
  return { body, headers };
}

let requestCounter = 0;

/** Generate a unique request ID */
function generateRequestId(): string {
  return `proxy-${++requestCounter}-${Date.now()}`;
}

/** Proxy-aware HttpClient replacement. */
export class ProxyHttpClient {
  /** The client type tag sent with every request for rule matching. */
  protected readonly clientType: ApiClientType = 'http';
  protected readonly transport: IProxyTransport | undefined;

  constructor(transport?: IProxyTransport) {
    this.transport = transport;
  }

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

  /**
   * Generic fetch -- the method is read from options (defaults to GET).
   * This is the catch-all that SPFx clients expose alongside the convenience methods above.
   */
  async fetch(url: string, _config?: any, options?: any): Promise<MockProxyResponse> {
    const method = options?.method || 'GET';
    const { body, headers } = extractOptions(options);
    return this._send(url, method, headers, body);
  }

  /** Internal helper that sends through the transport and wraps the response. */
  protected async _send(
    url: string,
    method: string,
    headers?: Record<string, string>,
    body?: string,
  ): Promise<MockProxyResponse> {
    // Fallback to stub response if no transport configured
    if (!this.transport) {
      console.warn(
        `[ProxyHttpClient] No transport configured - returning stub response for ${method} ${url}`,
      );
      return new MockProxyResponse(200, '{}', { 'content-type': 'application/json' });
    }

    const response = await this.transport.sendRequest({
      id: generateRequestId(),
      url,
      method,
      headers,
      body,
      clientType: this.clientType,
    });
    return new MockProxyResponse(response.status, response.body, response.headers);
  }
}
