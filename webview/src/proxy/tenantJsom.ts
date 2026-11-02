/**
 * Tenant JSOM
 *
 * Lets SharePoint's JavaScript object model (JSOM / CSOM: SP.ClientContext, SP.CamlQuery,
 * KeywordQuery) run in the workbench against the configured tenant:
 * - the JSOM scripts (/_layouts/15/SP.js, ...) are fetched from the tenant and run in the page
 * - the page globals JSOM expects (_spPageContextInfo, __REQUESTDIGEST) are created from the page context
 * - XMLHttpRequest calls to the tenant (JSOM's transport) go through the proxy, where the extension
 *   host adds the user's token
 */
import type { IPageContextConfig, IProxyTransport } from '@spfx-local-workbench/shared';
import { configureSharePointScripts, decodeProxyBody } from '@spfx-local-workbench/shared';

import { getSiteOrigin, toTenantUrl } from './tenantUrls';

let requestCounter = 0;
const nextId = (prefix: string) => `${prefix}-${++requestCounter}-${Date.now()}`;

export function installTenantJsom(
  transport: IProxyTransport,
  pageContext: IPageContextConfig | undefined,
): void {
  const siteOrigin = getSiteOrigin(pageContext?.site?.absoluteUrl);
  if (!siteOrigin || !pageContext) {
    return;
  }

  installPageGlobals(pageContext);

  // JSOM scripts: fetch their text from the tenant through the proxy
  configureSharePointScripts(async (serverRelativeUrl) => {
    const url = toTenantUrl(serverRelativeUrl, siteOrigin);
    if (!url) {
      return undefined;
    }
    const response = await transport.sendRequest({
      id: nextId('tenant-script'),
      url,
      method: 'GET',
      headers: { Accept: 'application/javascript, */*;q=0.8' },
      clientType: 'http',
    });
    if (response.status < 200 || response.status >= 300) {
      return undefined;
    }
    const body = decodeProxyBody(response.body, response.bodyEncoding);
    return typeof body === 'string' ? body : new TextDecoder().decode(body);
  });

  installTenantXhr(transport, siteOrigin);
}

/** _spPageContextInfo and the request digest field, as a classic SharePoint page provides them */
function installPageGlobals(pageContext: IPageContextConfig): void {
  const win = window as any;
  const site = pageContext.site ?? ({} as IPageContextConfig['site']);
  const web = pageContext.web ?? ({} as IPageContextConfig['web']);
  const user = (pageContext as any).user ?? {};
  const legacy = (pageContext as any).legacyPageContext ?? {};

  win._spPageContextInfo = {
    ...legacy,
    siteAbsoluteUrl: site.absoluteUrl,
    siteServerRelativeUrl: site.serverRelativeUrl ?? new URL(site.absoluteUrl).pathname,
    webAbsoluteUrl: web.absoluteUrl,
    webServerRelativeUrl: web.serverRelativeUrl ?? new URL(web.absoluteUrl).pathname,
    webTitle: (web as any).title,
    webLanguage: legacy.webLanguage ?? 1033,
    currentLanguage: legacy.currentLanguage ?? 1033,
    currentUICultureName: legacy.currentUICultureName ?? 'en-US',
    userLoginName: user.loginName,
    userDisplayName: user.displayName,
    userEmail: user.email,
    layoutsUrl: '_layouts/15',
    isSPO: true,
    formDigestValue: 'spfx-local-workbench',
    formDigestTimeoutSeconds: 1800,
  };

  // JSOM sends the value of this field as X-RequestDigest; the extension host drops it (the token replaces it)
  if (!document.getElementById('__REQUESTDIGEST')) {
    const digest = document.createElement('input');
    digest.type = 'hidden';
    digest.id = '__REQUESTDIGEST';
    digest.name = '__REQUESTDIGEST';
    digest.value = 'spfx-local-workbench';
    document.body.appendChild(digest);
  }
}

/** Replaces XMLHttpRequest so requests to the tenant go through the proxy; other requests are untouched */
function installTenantXhr(transport: IProxyTransport, siteOrigin: string): void {
  const NativeXhr = window.XMLHttpRequest;
  if ((NativeXhr as any).__tenantProxy) {
    return;
  }

  class TenantXMLHttpRequest extends EventTarget {
    static readonly UNSENT = 0;
    static readonly OPENED = 1;
    static readonly HEADERS_RECEIVED = 2;
    static readonly LOADING = 3;
    static readonly DONE = 4;
    static readonly __tenantProxy = true;

    readonly UNSENT = 0;
    readonly OPENED = 1;
    readonly HEADERS_RECEIVED = 2;
    readonly LOADING = 3;
    readonly DONE = 4;

    onreadystatechange: ((this: any, ev: Event) => any) | null = null;
    onload: ((this: any, ev: Event) => any) | null = null;
    onloadend: ((this: any, ev: Event) => any) | null = null;
    onerror: ((this: any, ev: Event) => any) | null = null;
    onabort: ((this: any, ev: Event) => any) | null = null;
    ontimeout: ((this: any, ev: Event) => any) | null = null;
    onloadstart: ((this: any, ev: Event) => any) | null = null;
    onprogress: ((this: any, ev: Event) => any) | null = null;

    readyState = 0;
    status = 0;
    statusText = '';
    responseType: XMLHttpRequestResponseType = '';
    responseURL = '';
    timeout = 0;
    withCredentials = false;
    readonly upload = new EventTarget();

    private _native: XMLHttpRequest | undefined;
    private _method = 'GET';
    private _url = '';
    private _tenantUrl: string | undefined;
    private _headers: Record<string, string> = {};
    private _responseHeaders: Record<string, string> = {};
    private _body: string | Uint8Array = '';
    private _aborted = false;

    get responseText(): string {
      if (this._native) return this._native.responseText;
      return typeof this._body === 'string' ? this._body : new TextDecoder().decode(this._body);
    }

    get response(): any {
      if (this._native) return this._native.response;
      if (this.readyState !== 4) return null;
      switch (this.responseType) {
        case 'json':
          try {
            return JSON.parse(this.responseText);
          } catch {
            return null;
          }
        case 'arraybuffer': {
          const bytes =
            typeof this._body === 'string' ? new TextEncoder().encode(this._body) : this._body;
          return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        }
        case 'blob':
          return new Blob([this._body as BlobPart], {
            type: this.getResponseHeader('content-type') ?? '',
          });
        default:
          return this.responseText;
      }
    }

    get responseXML(): Document | null {
      if (this._native) return this._native.responseXML;
      try {
        return new DOMParser().parseFromString(this.responseText, 'application/xml');
      } catch {
        return null;
      }
    }

    open(
      method: string,
      url: string | URL,
      async = true,
      user?: string | null,
      password?: string | null,
    ): void {
      this._method = method.toUpperCase();
      this._url = String(url);
      this._tenantUrl = toTenantUrl(this._url, siteOrigin, { includeGraph: true });
      if (!this._tenantUrl) {
        // Not a tenant request: use the browser's XMLHttpRequest and mirror its state
        this._native = new NativeXhr();
        this._native.onreadystatechange = (ev) => {
          this.readyState = this._native!.readyState;
          this.status = this._native!.status;
          this.statusText = this._native!.statusText;
          this.responseURL = this._native!.responseURL;
          this._fire('readystatechange', ev);
        };
        for (const type of [
          'load',
          'loadend',
          'error',
          'abort',
          'timeout',
          'loadstart',
          'progress',
        ]) {
          this._native.addEventListener(type, (ev) => this._fire(type, ev));
        }
        this._native.open(method, url, async, user ?? null, password ?? null);
        return;
      }
      this.readyState = 1;
      this._fire('readystatechange');
    }

    setRequestHeader(name: string, value: string): void {
      if (this._native) {
        this._native.setRequestHeader(name, value);
        return;
      }
      this._headers[name] = value;
    }

    overrideMimeType(mime: string): void {
      this._native?.overrideMimeType(mime);
    }

    getResponseHeader(name: string): string | null {
      if (this._native) return this._native.getResponseHeader(name);
      const key = Object.keys(this._responseHeaders).find(
        (k) => k.toLowerCase() === name.toLowerCase(),
      );
      return key ? this._responseHeaders[key] : null;
    }

    getAllResponseHeaders(): string {
      if (this._native) return this._native.getAllResponseHeaders();
      return Object.entries(this._responseHeaders)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n');
    }

    abort(): void {
      if (this._native) {
        this._native.abort();
        return;
      }
      this._aborted = true;
    }

    send(body?: Document | XMLHttpRequestBodyInit | null): void {
      if (this._native) {
        this._native.timeout = this.timeout;
        this._native.withCredentials = this.withCredentials;
        this._native.responseType = this.responseType;
        this._native.send(body as any);
        return;
      }

      this._fire('loadstart');
      const serialized =
        body === undefined || body === null
          ? undefined
          : typeof body === 'string'
            ? body
            : body instanceof Document
              ? new XMLSerializer().serializeToString(body)
              : String(body);

      transport
        .sendRequest({
          id: nextId('tenant-xhr'),
          url: this._tenantUrl!,
          method: this._method,
          headers: this._headers,
          body: serialized,
          clientType: 'http',
        })
        .then((response) => {
          if (this._aborted) {
            this._finish('abort');
            return;
          }
          this.status = response.status;
          this.statusText = response.status >= 200 && response.status < 300 ? 'OK' : 'Error';
          this.responseURL = this._tenantUrl!;
          this._responseHeaders = response.headers ?? {};
          this._body = decodeProxyBody(response.body ?? '', response.bodyEncoding);
          this.readyState = 2;
          this._fire('readystatechange');
          this.readyState = 3;
          this._fire('readystatechange');
          this._finish('load');
        })
        .catch(() => {
          this.status = 0;
          this._finish('error');
        });
    }

    private _finish(type: 'load' | 'error' | 'abort'): void {
      this.readyState = 4;
      this._fire('readystatechange');
      this._fire(type);
      this._fire('loadend');
    }

    private _fire(type: string, source?: Event): void {
      const event = source && source.type === type ? new Event(type) : new Event(type);
      const handler = (this as any)[`on${type}`];
      if (typeof handler === 'function') {
        try {
          handler.call(this, event);
        } catch (error) {
          console.error(error);
        }
      }
      this.dispatchEvent(event);
    }
  }

  (window as any).XMLHttpRequest = TenantXMLHttpRequest;
}
