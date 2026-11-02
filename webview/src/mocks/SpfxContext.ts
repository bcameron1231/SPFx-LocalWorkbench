import { StatusRenderer, buildMockPageContext } from '@spfx-local-workbench/shared';
import {
  MockDigestCache,
  MockThemeProvider,
  ProxyAadHttpClient,
  ProxyGraphClient,
  ProxyHttpClient,
  ProxySPHttpClient,
} from '@spfx-local-workbench/shared';
import type { IClientSideComponentManifest } from '@spfx-local-workbench/shared';
import type { DynamicDataHost } from '@spfx-local-workbench/shared';

import { getVsCodeProxyTransport } from '../proxy';
import { PassthroughHttpClient } from '../proxy/PassthroughHttpClient';
import type { IContextSettings } from '../types';
import { spfxThemeService } from './SpfxThemeService';

/** Placeholder handed to web parts by aadTokenProviderFactory; never a real token */
const LOCAL_WORKBENCH_TOKEN = 'spfx-local-workbench-placeholder-token';

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
  private dynamicDataHost: DynamicDataHost;

  constructor(
    contextSettings: IContextSettings,
    dynamicDataHost: DynamicDataHost,
    proxyEnabled: boolean = true,
  ) {
    this.contextSettings = contextSettings;
    this.dynamicDataHost = dynamicDataHost;
    this.proxyEnabled = proxyEnabled;
    this.statusRenderer = new StatusRenderer();
  }

  createMockContext(manifest: IClientSideComponentManifest, instanceId: string): any {
    const mockPageContext = buildMockPageContext(this.contextSettings.pageContext);

    // Get the VS Code proxy transport for routing API calls through the extension
    const transport = this.proxyEnabled ? getVsCodeProxyTransport() : undefined;

    // Services web parts consume with serviceScope.consume(<Class>.serviceKey)
    const digestCache = new MockDigestCache();
    // Per web part, so a web part in a section with a background gets that section's theme variant
    const themeService = spfxThemeService.forInstance(instanceId);
    const consumeService = (key: any): any => {
      if (key === MockThemeProvider.serviceKey) {
        return themeService;
      }
      if (key === MockDigestCache.serviceKey) {
        return digestCache;
      }
      return {};
    };

    return {
      instanceId: instanceId,
      manifest,
      pageContext: mockPageContext,
      serviceScope: {
        consume: consumeService,
        createChildScope: () => ({
          consume: consumeService,
          finish: () => {},
        }),
        finish: () => {},
        whenFinished: (callback: () => void) => callback(),
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
        // Graph calls go through the proxy like the other clients (mock rules, or the tenant)
        getClient: () => Promise.resolve(new ProxyGraphClient(transport)),
      },
      aadTokenProviderFactory: {
        // The real token stays in the extension host: requests sent to the tenant get their
        // Authorization header replaced there, so web parts only need a placeholder here.
        getTokenProvider: () =>
          Promise.resolve({
            getToken: (_resource: string) => Promise.resolve(LOCAL_WORKBENCH_TOKEN),
            tokenAcquisitionEvent: { add: () => {}, remove: () => {} },
          }),
      },
      sdks: {
        microsoftTeams: undefined, // Not running in Teams context
      },
      isServedFromLocalhost: true,
      dynamicDataProvider: this.dynamicDataHost.createProvider(),
      dynamicDataSourceManager: this.dynamicDataHost.createSourceManager(
        manifest.id,
        instanceId,
        manifest.alias,
      ),
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
