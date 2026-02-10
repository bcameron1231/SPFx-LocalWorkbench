// Proxy Bridge
//
// Shared infrastructure for routing API calls from the webview through the
// VS Code extension host via postMessage. Manages request correlation so
// each call gets back the correct response.

import type { IVsCodeApi } from '../types';

// Client type identifier (mirrors extension-side ApiClientType)
export type ApiClientType = 'spHttp' | 'http' | 'aadHttp' | 'fetch';

// Serialized request sent to extension host
export interface IProxyRequest {
    id: string;
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
    clientType: ApiClientType;
}

// Serialized response received from extension host
export interface IProxyResponse {
    id: string;
    status: number;
    headers: Record<string, string>;
    body: string;
    matched: boolean;
}

// Pending request waiting for a response
interface IPendingRequest {
    resolve: (response: IProxyResponse) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
}

// Default timeout for proxy requests (30 seconds)
const REQUEST_TIMEOUT_MS = 30_000;

let requestCounter = 0;

// Generate a unique request ID
function generateRequestId(): string {
    return `proxy-${++requestCounter}-${Date.now()}`;
}

// The ProxyBridge is a singleton that manages the postMessage channel between
// the webview proxy clients and the extension host ApiProxyService.
class ProxyBridge {
    private static _instance: ProxyBridge | undefined;
    private _vscodeApi: IVsCodeApi | undefined;
    private _pending = new Map<string, IPendingRequest>();
    private _initialized = false;

    static getInstance(): ProxyBridge {
        if (!ProxyBridge._instance) {
            ProxyBridge._instance = new ProxyBridge();
        }
        return ProxyBridge._instance;
    }

    // Initialize with the VS Code API handle and start listening for responses
    initialize(vscodeApi: IVsCodeApi): void {
        if (this._initialized) {
            return;
        }
        this._vscodeApi = vscodeApi;
        this._initialized = true;

        // Listen for apiResponse messages from the extension host
        window.addEventListener('message', (event: MessageEvent) => {
            const message = event.data;
            if (message && message.command === 'apiResponse') {
                this._handleResponse(message as IProxyResponse & { command: string });
            }
        });
    }

    // Send an API request through the bridge and wait for the response
    sendRequest(
        url: string,
        method: string,
        clientType: ApiClientType,
        headers?: Record<string, string>,
        body?: string
    ): Promise<IProxyResponse> {
        if (!this._vscodeApi) {
            // If bridge not initialized, return an empty mock (graceful fallback)
            return Promise.resolve({
                id: 'fallback',
                status: 200,
                headers: { 'content-type': 'application/json' },
                body: '{}',
                matched: false
            });
        }

        const id = generateRequestId();

        const request: IProxyRequest = {
            id,
            url,
            method,
            headers,
            body,
            clientType
        };

        return new Promise<IProxyResponse>((resolve, reject) => {
            // Set up a timeout so requests don't hang forever
            const timer = setTimeout(() => {
                this._pending.delete(id);
                reject(new Error(`API proxy request timed out: ${method} ${url}`));
            }, REQUEST_TIMEOUT_MS);

            this._pending.set(id, { resolve, reject, timer });

            // Send the request to the extension host
            this._vscodeApi!.postMessage({
                command: 'apiRequest',
                ...request
            });
        });
    }

    // Handle a response message from the extension host
    private _handleResponse(message: IProxyResponse & { command: string }): void {
        const pending = this._pending.get(message.id);
        if (pending) {
            clearTimeout(pending.timer);
            this._pending.delete(message.id);
            pending.resolve({
                id: message.id,
                status: message.status,
                headers: message.headers,
                body: message.body,
                matched: message.matched
            });
        }
    }

    // Reset state (called during live reload)
    reset(): void {
        // Reject any pending requests
        for (const [id, pending] of this._pending) {
            clearTimeout(pending.timer);
            pending.reject(new Error('Proxy bridge reset (live reload)'));
            this._pending.delete(id);
        }
    }
}

// -- Response Wrapper --

// SPFx-compatible response wrapper that mimics SPHttpClientResponse.
// Web parts call .json(), .text(), .ok, .status on these objects.
export class MockProxyResponse {
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

// Get the shared ProxyBridge instance
export function getProxyBridge(): ProxyBridge {
    return ProxyBridge.getInstance();
}

// Initialize the proxy bridge with VS Code API
export function initializeProxyBridge(vscodeApi: IVsCodeApi): void {
    ProxyBridge.getInstance().initialize(vscodeApi);
}

// Reset the proxy bridge (for live reload)
export function resetProxyBridge(): void {
    ProxyBridge.getInstance().reset();
}
