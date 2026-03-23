// Proxy AAD HttpClient
import { ProxyHttpClient } from './ProxyHttpClient';
import type { ApiClientType } from './ProxyBridge';

// Proxy-aware AAD HTTP client.
// Tags all requests with clientType 'aadHttp' so mock rules can target
// AAD-protected API calls specifically.
export class ProxyAadHttpClient extends ProxyHttpClient {
    protected readonly clientType: ApiClientType = 'aadHttp';
}
