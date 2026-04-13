// Register Proxy HTTP Clients in AMD Module System
//
// Overrides the stub HTTP client classes in the AMD module registry with the actual
// proxy-aware implementations so web parts that import classes from '@microsoft/sp-http'
// get the proxy clients instead of the stubs.

import { ProxyAadHttpClient } from './ProxyAadHttpClient';
import { ProxyHttpClient } from './ProxyHttpClient';
import { ProxySPHttpClient } from './ProxySPHttpClient';

export function registerProxyHttpClients(): void {
  if (!window.__amdModules) {
    console.warn('[registerProxyHttpClients] __amdModules not initialized');
    return;
  }

  // Override the stub classes with proxy-aware implementations
  window.__amdModules['@microsoft/sp-http'] = {
    HttpClient: ProxyHttpClient,
    SPHttpClient: ProxySPHttpClient,
    AadHttpClient: ProxyAadHttpClient,
    SPHttpClientConfiguration: {},
    HttpClientConfiguration: {},
    AadHttpClientConfiguration: {},
  };
}
