/**
 * Fetch Interceptor
 *
 * Shared fetch interception logic that routes API requests through an IProxyTransport.
 * Works in both webview (VsCodeProxyTransport) and Storybook (BrowserProxyTransport).
 *
 * Overrides window.fetch and passes every request to the transport. The transport is
 * responsible for returning either a mock response or a real network response depending
 * on its configured mode — the interceptor always uses whatever the transport returns.
 * On transport error the interceptor falls back to the real network.
 * Handles Request objects correctly, extracting method, headers, and body.
 */
import type { IProxyTransport } from '../IProxyTransport';
import { extractHeaders, serializeBody } from './fetchHelpers';

// Store the original fetch so we can restore it later
let originalFetch: typeof window.fetch | null = null;

// Monotonic counter for unique request IDs — matches the pattern used in ProxyHttpClient
let requestCounter = 0;
function generateRequestId(): string {
  return `fetch-${++requestCounter}-${Date.now()}`;
}

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
    // If 'body' is an own key on init (even when null), it takes precedence over
    // the Request body — explicitly passing { body: null } means "no body".
    let body: string | undefined;
    if (init && 'body' in init) {
      // Caller explicitly set body (possibly null to clear it)
      if (init.body !== null && init.body !== undefined) {
        body = await serializeBody(init.body);
      }
      // null/undefined → no body (body remains undefined)
    } else if (input instanceof Request && input.body !== null) {
      body = await input.clone().text();
    }

    try {
      // Send every request through the transport.
      // In mock mode, unmatched requests return the configured fallback status.
      // In mock-passthrough mode, the transport handles real network calls internally for unmatched requests.
      const proxyResponse = await transport.sendRequest({
        id: generateRequestId(),
        url,
        method,
        headers,
        body,
        clientType: 'fetch',
      });

      // The transport always returns a complete response — use it directly
      const responseHeaders = new Headers(proxyResponse.headers || {});
      return new Response(proxyResponse.body || '{}', {
        status: proxyResponse.status,
        statusText: proxyResponse.status >= 200 && proxyResponse.status < 300 ? 'OK' : 'Error',
        headers: responseHeaders,
      });
    } catch (error) {
      console.warn('[FetchInterceptor] Proxy error, falling back to network:', error);
    }

    // Transport errored — fall through to real network as last resort
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
