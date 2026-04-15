/**
 * VS Code Proxy Transport
 *
 * Implementation of IProxyTransport that sends API requests to the VS Code extension host
 * via postMessage and receives responses back. Handles request correlation and timeouts.
 */
import type { IProxyRequest, IProxyResponse, IProxyTransport } from '@spfx-local-workbench/shared';

import type { IVsCodeApi } from '../types';

/** Default timeout for proxy requests (30 seconds) */
const REQUEST_TIMEOUT_MS = 30_000;

/** Pending request waiting for a response */
interface IPendingRequest {
  resolve: (response: IProxyResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let requestCounter = 0;

/** Generate a unique request ID */
function generateRequestId(): string {
  return `proxy-${++requestCounter}-${Date.now()}`;
}

/**
 * Transport that communicates with VS Code extension host via postMessage.
 * Used by proxy HTTP clients in the webview to route API calls through the extension.
 */
export class VsCodeProxyTransport implements IProxyTransport {
  private static _instance: VsCodeProxyTransport | undefined;
  private _vscodeApi: IVsCodeApi | undefined;
  private _pending = new Map<string, IPendingRequest>();
  private _initialized = false;

  /** Get the singleton instance */
  static getInstance(): VsCodeProxyTransport {
    if (!VsCodeProxyTransport._instance) {
      VsCodeProxyTransport._instance = new VsCodeProxyTransport();
    }
    return VsCodeProxyTransport._instance;
  }

  /**
   * Initialize the transport with VS Code API and start listening for responses
   * @param vscodeApi VS Code webview API handle
   */
  initialize(vscodeApi: IVsCodeApi): void {
    if (this._initialized) {
      console.log('[VsCodeProxyTransport] Already initialized');
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

  /**
   * Send an API request through the transport
   * @param request Serialized API request
   * @returns Promise resolving to the API response
   */
  async sendRequest(request: IProxyRequest): Promise<IProxyResponse> {
    if (!this._vscodeApi) {
      // If not initialized, return an empty mock response (graceful fallback)
      console.warn(
        '[VsCodeProxyTransport] NOT INITIALIZED - returning fallback response for:',
        request.method,
        request.url,
      );
      return {
        id: request.id,
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: '{}',
        matched: false,
      };
    }

    // Generate unique ID if not provided
    const id = request.id || generateRequestId();
    const requestWithId: IProxyRequest = { ...request, id };

    return new Promise<IProxyResponse>((resolve, reject) => {
      // Set up timeout so requests don't hang forever
      const timer = setTimeout(() => {
        this._pending.delete(id);
        reject(
          new Error(`API proxy request timed out: ${requestWithId.method} ${requestWithId.url}`),
        );
      }, REQUEST_TIMEOUT_MS);

      this._pending.set(id, { resolve, reject, timer });

      // Send the request to the extension host
      this._vscodeApi!.postMessage({
        command: 'apiRequest',
        ...requestWithId,
      });
    });
  }

  /**
   * Handle a response message from the extension host
   */
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
        matched: message.matched,
      });
    }
  }

  /**
   * Reset state (called during live reload)
   * Rejects all pending requests and clears the queue
   */
  reset(): void {
    for (const [id, pending] of this._pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Proxy transport reset (live reload)'));
      this._pending.delete(id);
    }
  }
}

/** Get the shared VsCodeProxyTransport singleton */
export function getVsCodeProxyTransport(): VsCodeProxyTransport {
  return VsCodeProxyTransport.getInstance();
}

/** Initialize the VS Code proxy transport with the webview API */
export function initializeVsCodeProxyTransport(vscodeApi: IVsCodeApi): void {
  VsCodeProxyTransport.getInstance().initialize(vscodeApi);
}

/** Reset the VS Code proxy transport (for live reload) */
export function resetVsCodeProxyTransport(): void {
  VsCodeProxyTransport.getInstance().reset();
}
