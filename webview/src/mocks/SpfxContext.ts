import { buildMockPageContext } from '@spfx-local-workbench/shared';

import type { IContextSettings } from '../types';

/**
 * Creates mock SPFx context for web parts and extensions.
 *
 * Context is always provided by the extension (via WorkbenchConfig defaults),
 * so no local defaults are needed.
 */
export class SpfxContext {
  private contextSettings: IContextSettings;

  constructor(contextSettings: IContextSettings) {
    this.contextSettings = contextSettings;
  }

  createMockContext(webPartId: string, instanceId: string): any {
    const mockPageContext = buildMockPageContext(this.contextSettings.pageContext);

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
      httpClient: this.createMockHttpClient(),
      spHttpClient: this.createMockSpHttpClient(),
      aadHttpClientFactory: {
        getClient: () => Promise.resolve(this.createMockHttpClient()),
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
    };
  }

  private createMockHttpClient(): any {
    return {
      get: (_url: string, _config?: any) =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      post: (_url: string, _config?: any, _options?: any) =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      fetch: (_url: string, _config?: any, _options?: any) =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }),
    };
  }

  private createMockSpHttpClient(): any {
    const configurations = {
      v1: { flags: {} },
    };
    return {
      configurations: configurations,
      get: (_url: string, _config?: any) =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ d: {} }),
        }),
      post: (_url: string, _config?: any, _options?: any) =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ d: {} }),
        }),
      fetch: (_url: string, _config?: any, _options?: any) =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ d: {} }),
        }),
    };
  }
}
