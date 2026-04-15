/** Proxy AAD HttpClient */
import type { ApiClientType } from '../types';
import { ProxyHttpClient } from './ProxyHttpClient';

/**
 * Proxy-aware AAD HTTP client.
 * Tags all requests with clientType 'aadHttp' so mock rules can target
 * AAD-protected API calls specifically.
 */
export class ProxyAadHttpClient extends ProxyHttpClient {
  protected readonly clientType: ApiClientType = 'aadHttp';
}
