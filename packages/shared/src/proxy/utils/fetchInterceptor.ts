/**
 * Fetch Interceptor
 *
 * Shared fetch interception logic that routes API requests through an IProxyTransport.
 * Works in both webview (VsCodeProxyTransport) and Storybook (BrowserProxyTransport).
 *
 * Overrides window.fetch and passes every request to the transport. If the transport
 * returns matched:false (no rule matched), the request falls through to the real network.
 * This allows mocking any URL — SharePoint REST, Graph, custom APIs, etc.
 * Handles Request objects correctly, extracting method, headers, and body.
 */
import type { IProxyTransport } from '../IProxyTransport';
import { extractHeaders, serializeBody } from './fetchHelpers';

// Store the original fetch so we can restore it later
let originalFetch: typeof window.fetch | null = null;

/**
 * Install a fetch interceptor that routes API requests through the provided transport
 * @param transport The proxy transport to route requests through
 */
export function installFetchInterceptor(transport: IProxyTransport): void {
  // Save the original fetch if not already saved
  if (!originalFetch) {
    originalFetch = window.fetch.bind(window);
  }

  // Create the intercepted fetch function
  window.fetch = async function interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // Resolve the URL
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Extract method - handle Request objects when init is undefined
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();

    // Extract headers - handle Request objects when init.headers is undefined
    const rawInitHeaders = init?.headers;
    let resolvedHeaders: HeadersInit | undefined = rawInitHeaders;
    if (!resolvedHeaders && input instanceof Request) {
      const h: Record<string, string> = {};
      input.headers.forEach((value, key) => {
        h[key] = value;
      });
      resolvedHeaders = h;
    }
    const headers = extractHeaders(resolvedHeaders);

    // Extract body - handle Request objects when init.body is undefined.
    // When input is a Request, use clone().text() rather than input.body directly:
    // passing the ReadableStream to serializeBody would consume it, breaking
    // the originalFetch passthrough for non-API URLs.
    let body: string | undefined;
    if (init?.body !== null && init?.body !== undefined) {
      body = await serializeBody(init.body);
    } else if (input instanceof Request && input.body !== null) {
      body = await input.clone().text();
    }

    try {
      // Send every request through the transport — the rule engine decides what matches.
      // If no rule matches (matched:false), fall through to the real network below.
      const proxyResponse = await transport.sendRequest({
        id: `fetch-${Date.now()}`,
        url,
        method,
        headers,
        body,
        clientType: 'fetch',
      });

      if (proxyResponse.matched) {
        // A mock rule matched — return the mocked response
        const responseHeaders = new Headers(proxyResponse.headers || {});
        return new Response(proxyResponse.body || '{}', {
          status: proxyResponse.status,
          statusText: proxyResponse.status >= 200 && proxyResponse.status < 300 ? 'OK' : 'Error',
          headers: responseHeaders,
        });
      }
    } catch (error) {
      console.warn('[FetchInterceptor] Proxy error, falling back to network:', error);
    }

    // No rule matched or proxy errored — pass through to the real network
    return originalFetch!.call(window, input, init);
  };
}

/**
 * Restore the original browser fetch.
 * Call this during cleanup or when disabling the proxy (e.g. useEffect return in Storybook).
 */
export function uninstallFetchInterceptor(): void {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}
