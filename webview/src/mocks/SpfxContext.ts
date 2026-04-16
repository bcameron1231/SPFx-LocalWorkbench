import { StatusRenderer, buildMockPageContext } from '@spfx-local-workbench/shared';
import {
  ProxyAadHttpClient,
  ProxyHttpClient,
  ProxySPHttpClient,
} from '@spfx-local-workbench/shared';

import { getVsCodeProxyTransport } from '../proxy';
import { PassthroughHttpClient } from '../proxy/PassthroughHttpClient';
import type { IContextSettings } from '../types';

/**
 * Creates mock SPFx context for web parts and extensions.
 *
 * Context is always provided by the extension (via WorkbenchConfig defaults),
 * so no local defaults are needed.
 */
export class SpfxContext {
  private contextSettings: IContextSettings;
  private proxyEnabled: boolean;
  private statusRenderer: StatusRenderer;

  constructor(contextSettings: IContextSettings, proxyEnabled: boolean = true) {
    this.contextSettings = contextSettings;
    this.proxyEnabled = proxyEnabled;
    this.statusRenderer = new StatusRenderer();
  }

  createMockContext(webPartId: string, instanceId: string): any {
    const mockPageContext = buildMockPageContext(this.contextSettings.pageContext);

    // Get the VS Code proxy transport for routing API calls through the extension
    const transport = this.proxyEnabled ? getVsCodeProxyTransport() : undefined;

    return {
      instanceId: instanceId,
      manifest: { id: webPartId },
      pageContext: mockPageContext,
      serviceScope: {
        consume: (_key: any) => {
          return {};
        },
        createChildScope: () => ({
          consume: () => ({}),
          finish: () => {},
        }),
        finish: () => {},
      },
      httpClient: this.proxyEnabled ? new ProxyHttpClient(transport) : new PassthroughHttpClient(),
      spHttpClient: this.proxyEnabled
        ? new ProxySPHttpClient(transport)
        : new PassthroughHttpClient(),
      aadHttpClientFactory: {
        getClient: () =>
          Promise.resolve(
            this.proxyEnabled ? new ProxyAadHttpClient(transport) : new PassthroughHttpClient(),
          ),
      },
      msGraphClientFactory: {
        getClient: () =>
          Promise.resolve({
            api: () => ({
              get: () => Promise.resolve({}),
              post: () => Promise.resolve({}),
              patch: () => Promise.resolve({}),
              delete: () => Promise.resolve({}),
            }),
          }),
      },
      sdks: {
        microsoftTeams: undefined, // Not running in Teams context
      },
      isServedFromLocalhost: true,
      domElement: null,
      propertyPane: {
        refresh: () => {},
        open: () => {},
        close: () => {},
        isRenderedByWebPart: () => true,
        isPropertyPaneOpen: () => false,
      },
      statusRenderer: this.statusRenderer,
    };
  }
}
