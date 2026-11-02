/** Proxy AAD HttpClient */
import type { ApiClientType } from '../types';
import { ProxyHttpClient } from './ProxyHttpClient';

/**
 * Proxy-aware AAD HTTP client.
 * Tags all requests with clientType 'aadHttp' so mock rules can target
 * AAD-protected API calls specifically.
 */
export class ProxyAadHttpClient extends ProxyHttpClient {
  /** SPFx AadHttpClient requires this as a static property (accessed as AadHttpClient.configurations.v1) */
  static configurations = {
    v1: { flags: {} },
  };

  protected readonly clientType: ApiClientType = 'aadHttp';
}
