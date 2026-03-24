// Proxy SPHttpClient
import type { ApiClientType } from './ProxyBridge';
import { ProxyHttpClient } from './ProxyHttpClient';

// Proxy-aware SPHttpClient replacement.
// Tags all requests with clientType 'spHttp' so mock rules can target harePoint REST API calls specifically.
export class ProxySPHttpClient extends ProxyHttpClient {
  static configurations = { v1: {} };

  protected readonly clientType: ApiClientType = 'spHttp';
}
