/** Proxy SPHttpClient */
import type { IProxyTransport } from '../IProxyTransport';
import type { ApiClientType } from '../types';
import { ProxyHttpClient } from './ProxyHttpClient';

/**
 * Proxy-aware SPHttpClient replacement.
 * Tags all requests with clientType 'spHttp' so mock rules can target SharePoint REST API calls specifically.
 */
export class ProxySPHttpClient extends ProxyHttpClient {
  /** SPFx SPHttpClient requires this property */
  public readonly configurations = {
    v1: { flags: {} },
  };

  protected readonly clientType: ApiClientType = 'spHttp';

  constructor(transport?: IProxyTransport) {
    super(transport);
  }
}
