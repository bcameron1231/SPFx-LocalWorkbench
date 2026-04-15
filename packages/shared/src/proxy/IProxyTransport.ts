/**
 * Proxy Transport Interface
 *
 * Abstraction layer that allows proxy clients to work in different environments
 * (VS Code webview via postMessage, or Storybook browser with local files)
 */
import type { IProxyRequest, IProxyResponse } from './types';

/**
 * Transport layer for routing proxy requests to the mock system.
 *
 * Implementations:
 * - VsCodeProxyTransport: Uses postMessage to communicate with extension host
 * - BrowserProxyTransport: Uses in-memory MockRuleEngine with fetched config
 */
export interface IProxyTransport {
  /**
   * Send a proxy request and wait for the response.
   *
   * @param request The request to send
   */
  sendRequest(request: IProxyRequest): Promise<IProxyResponse>;
}
