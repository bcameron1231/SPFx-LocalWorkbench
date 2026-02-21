// Proxy Fetch Client
//
// Overrides the global window.fetch so that libraries like PnPJS, which use fetch under the covers, get routed through the proxy bridge for mock/intercept support.
//
//[BEAU] This isn't going to work for all scenarios. If you find this debugging, I hope you have a cookie and a comfy chair. We should probably be doing something more robust here, but this is a start.
import { getProxyBridge } from './ProxyBridge';

// Stash the original fetch so we can fall back or restore later
const originalFetch: typeof window.fetch = window.fetch.bind(window);

function extractHeaders(raw: HeadersInit | undefined): Record<string, string> | undefined {
    if (!raw) {
        return undefined;
    }
    const headers: Record<string, string> = {};
    if (raw instanceof Headers) {
        raw.forEach((value, key) => { headers[key] = value; });
    } else if (Array.isArray(raw)) {
        for (const [key, value] of raw) {
            headers[key] = value;
        }
    } else {
        return raw as Record<string, string>;
    }
    return headers;
}

// "Best-effort" serialization of a fetch body to a string.
// Handles the most common cases (string, ArrayBuffer, Uint8Array).
function serializeBody(raw: BodyInit | null | undefined): string | undefined {
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

// A fetch-compatible function that routes requests through the ProxyBridge.
// Returns a native Response object so callers (PnPJS, etc.) work unchanged.
async function proxyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Resolve the URL
    const url = typeof input === 'string'
        ? input
        : input instanceof URL
            ? input.href
            : input.url;

    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const rawInitHeaders = init?.headers;
    let resolvedHeaders: HeadersInit | undefined = rawInitHeaders;
    if (!resolvedHeaders && input instanceof Request) {
        const h: Record<string, string> = {};
        input.headers.forEach((value, key) => { h[key] = value; });
        resolvedHeaders = h;
    }
    const headers = extractHeaders(resolvedHeaders);
    const body = serializeBody(init?.body ?? (input instanceof Request ? (init?.body ?? undefined) : undefined));

    // Send through the proxy bridge
    const proxyResponse = await getProxyBridge().sendRequest(url, method, 'fetch', headers, body);

    // Wrap as a native Response so fetch consumers
    const responseHeaders = new Headers(proxyResponse.headers);
    return new Response(proxyResponse.body, {
        status: proxyResponse.status,
        statusText: proxyResponse.status >= 200 && proxyResponse.status < 300 ? 'OK' : 'Error',
        headers: responseHeaders
    });
}

// Install the fetch proxy — replaces window.fetch with the proxy version.
// Call this during workbench initialization when the proxy is enabled.
export function installFetchProxy(): void {
    window.fetch = proxyFetch as typeof window.fetch;
}

// Restore the original browser fetch.
// Call this during cleanup or when the proxy is disabled.
export function uninstallFetchProxy(): void {
    window.fetch = originalFetch;
}
