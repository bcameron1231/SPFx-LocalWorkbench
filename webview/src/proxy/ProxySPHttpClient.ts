// Proxy SPHttpClient
import { ProxyHttpClient } from './ProxyHttpClient';
import type { ApiClientType } from './ProxyBridge';

// Proxy-aware SPHttpClient replacement.
// Tags all requests with clientType 'spHttp' so mock rules can target harePoint REST API calls specifically.
export class ProxySPHttpClient extends ProxyHttpClient {
    static configurations = { v1: {} };

    protected readonly clientType: ApiClientType = 'spHttp';
}
