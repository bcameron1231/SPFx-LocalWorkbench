/** Proxy MSGraphClientV3 */
import type { IProxyTransport } from '../IProxyTransport';
import { ProxyAadHttpClient } from './ProxyAadHttpClient';

const GRAPH_ROOT = 'https://graph.microsoft.com';

/** Error shape the Microsoft Graph JS client throws (GraphError) */
export class ProxyGraphError extends Error {
  public statusCode: number;
  public code: string | undefined;
  public body: string;

  constructor(statusCode: number, body: string) {
    let message = `Graph request failed with status ${statusCode}`;
    let code: string | undefined;
    try {
      const parsed = JSON.parse(body);
      message = parsed?.error?.message ?? message;
      code = parsed?.error?.code;
    } catch {
      // Body is not JSON; keep the generic message
    }
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.body = body;
  }
}

/**
 * Chainable request, mirroring the parts of the Graph JS client's GraphRequest that SPFx code
 * uses: client.api(path).version('v1.0').select(...).top(10).get()
 */
export class ProxyGraphRequest {
  private _version = 'v1.0';
  private readonly _query: Record<string, string> = {};
  private readonly _headers: Record<string, string> = {};

  constructor(
    private readonly _http: ProxyAadHttpClient,
    private readonly _path: string,
  ) {}

  version(version: string): this {
    this._version = version;
    return this;
  }

  select(fields: string | string[]): this {
    return this._set('$select', fields);
  }

  expand(fields: string | string[]): this {
    return this._set('$expand', fields);
  }

  orderby(fields: string | string[]): this {
    return this._set('$orderby', fields);
  }

  filter(filter: string): this {
    return this._set('$filter', filter);
  }

  search(search: string): this {
    return this._set('$search', search);
  }

  top(n: number): this {
    return this._set('$top', String(n));
  }

  skip(n: number): this {
    return this._set('$skip', String(n));
  }

  skipToken(token: string): this {
    return this._set('$skipToken', token);
  }

  count(isCount = true): this {
    return this._set('$count', String(isCount));
  }

  query(query: string | Record<string, string | number | boolean>): this {
    if (typeof query === 'string') {
      for (const pair of query.replace(/^\?/, '').split('&')) {
        const [key, value = ''] = pair.split('=');
        if (key) {
          this._query[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }
    } else {
      for (const [key, value] of Object.entries(query)) {
        this._query[key] = String(value);
      }
    }
    return this;
  }

  header(name: string, value: string): this {
    this._headers[name] = value;
    return this;
  }

  headers(headers: Record<string, string>): this {
    Object.assign(this._headers, headers);
    return this;
  }

  // Accepted for compatibility; responses are always parsed as JSON when possible
  responseType(_type: string): this {
    return this;
  }

  option(_key: string, _value: unknown): this {
    return this;
  }

  middlewareOptions(_options: unknown[]): this {
    return this;
  }

  get(callback?: (error: unknown, response?: unknown) => void): Promise<any> {
    return this._withCallback(this._send('GET'), callback);
  }

  post(body: unknown, callback?: (error: unknown, response?: unknown) => void): Promise<any> {
    return this._withCallback(this._send('POST', body), callback);
  }

  create(body: unknown, callback?: (error: unknown, response?: unknown) => void): Promise<any> {
    return this.post(body, callback);
  }

  patch(body: unknown, callback?: (error: unknown, response?: unknown) => void): Promise<any> {
    return this._withCallback(this._send('PATCH', body), callback);
  }

  update(body: unknown, callback?: (error: unknown, response?: unknown) => void): Promise<any> {
    return this.patch(body, callback);
  }

  put(body: unknown, callback?: (error: unknown, response?: unknown) => void): Promise<any> {
    return this._withCallback(this._send('PUT', body), callback);
  }

  delete(callback?: (error: unknown, response?: unknown) => void): Promise<any> {
    return this._withCallback(this._send('DELETE'), callback);
  }

  del(callback?: (error: unknown, response?: unknown) => void): Promise<any> {
    return this.delete(callback);
  }

  /** Full request URL, as the Graph client would build it */
  buildUrl(): string {
    let url: string;
    if (/^https?:\/\//i.test(this._path)) {
      // Absolute URLs (e.g. @odata.nextLink) are used as they are
      url = this._path;
    } else {
      url = `${GRAPH_ROOT}/${this._version}/${this._path.replace(/^\//, '')}`;
    }
    const extra = Object.entries(this._query)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    if (!extra) {
      return url;
    }
    return url + (url.includes('?') ? '&' : '?') + extra;
  }

  private _set(key: string, value: string | string[]): this {
    this._query[key] = Array.isArray(value) ? value.join(',') : value;
    return this;
  }

  private async _send(method: string, body?: unknown): Promise<any> {
    const headers: Record<string, string> = { Accept: 'application/json', ...this._headers };
    let serialized: string | undefined;
    if (body !== undefined) {
      serialized = typeof body === 'string' ? body : JSON.stringify(body);
      if (!Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await this._http.fetch(this.buildUrl(), undefined, {
      method,
      headers,
      body: serialized,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new ProxyGraphError(response.status, text);
    }
    if (!text) {
      return undefined;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private _withCallback(
    promise: Promise<any>,
    callback?: (error: unknown, response?: unknown) => void,
  ): Promise<any> {
    if (callback) {
      promise.then(
        (result) => callback(null, result),
        (error) => callback(error),
      );
    }
    return promise;
  }
}

/** MSGraphClientV3 replacement that sends every request through the workbench proxy */
export class ProxyGraphClient {
  private readonly _http: ProxyAadHttpClient;

  constructor(transport?: IProxyTransport) {
    this._http = new ProxyAadHttpClient(transport);
  }

  api(path: string): ProxyGraphRequest {
    return new ProxyGraphRequest(this._http, path);
  }
}
