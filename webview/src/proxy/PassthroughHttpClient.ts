// Passthrough HttpClient
//
// A simple HTTP client that makes real fetch() calls instead of routing through the proxy bridge. Used when the API proxy is disabled, allowing external tools like Dev Proxy to intercept network traffic.

// SPFx-compatible response wrapper that mirrors SPHttpClientResponse.
class PassthroughResponse {
    public readonly ok: boolean;
    public readonly status: number;
    public readonly headers: Record<string, string>;
    private readonly _body: string;

    constructor(status: number, body: string, headers: Record<string, string>) {
        this.ok = status >= 200 && status < 300;
        this.status = status;
        this.headers = headers;
        this._body = body;
    }

    async json(): Promise<any> {
        try {
            return JSON.parse(this._body);
        } catch {
            return {};
        }
    }

    async text(): Promise<string> {
        return this._body;
    }
}

// Extracts body and headers from an SPFx-style options object.
function extractOptions(options?: any): { body?: string; headers?: Record<string, string> } {
    const body = options?.body
        ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
        : undefined;
    const headers = options?.headers;
    return { body, headers };
}

// HTTP client that delegates directly to the browser's fetch() API.
// Mirrors the SPFx HttpClient / SPHttpClient interface so web parts
// work without code changes, but actual network requests are made.
export class PassthroughHttpClient {
    static configurations = { v1: {} };

    async get(url: string, _config?: any): Promise<PassthroughResponse> {
        return this._send(url, 'GET');
    }

    async post(url: string, _config?: any, options?: any): Promise<PassthroughResponse> {
        const { body, headers } = extractOptions(options);
        return this._send(url, 'POST', headers, body);
    }

    async put(url: string, _config?: any, options?: any): Promise<PassthroughResponse> {
        const { body, headers } = extractOptions(options);
        return this._send(url, 'PUT', headers, body);
    }

    async patch(url: string, _config?: any, options?: any): Promise<PassthroughResponse> {
        const { body, headers } = extractOptions(options);
        return this._send(url, 'PATCH', headers, body);
    }

    async delete(url: string, _config?: any, options?: any): Promise<PassthroughResponse> {
        const { body, headers } = extractOptions(options);
        return this._send(url, 'DELETE', headers, body);
    }

    async head(url: string, _config?: any): Promise<PassthroughResponse> {
        return this._send(url, 'HEAD');
    }

    async options(url: string, _config?: any): Promise<PassthroughResponse> {
        return this._send(url, 'OPTIONS');
    }

    async fetch(url: string, _config?: any, options?: any): Promise<PassthroughResponse> {
        const method = options?.method || 'GET';
        const { body, headers } = extractOptions(options);
        return this._send(url, method, headers, body);
    }

    protected async _send(
        url: string,
        method: string,
        headers?: Record<string, string>,
        body?: string
    ): Promise<PassthroughResponse> {
        try {
            const response = await window.fetch(url, {
                method,
                headers,
                body
            });

            const text = await response.text();

            // Collect response headers
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            return new PassthroughResponse(response.status, text, responseHeaders);
        } catch (err: unknown) {
            // Network error — return a synthetic 0-status response so the
            // web part code path mirrors what SPHttpClient would surface
            const message = err instanceof Error ? err.message : String(err);
            return new PassthroughResponse(0, JSON.stringify({ error: message }), {});
        }
    }
}
