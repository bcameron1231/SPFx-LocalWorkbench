// Extension Manager
//
// Handles loading, instantiation, and lifecycle of SPFx Application Customizers.
// Application Customizers render content into header (Top) and footer (Bottom)
// placeholders on the page.
import {
  BundleLoader,
  CHANGED_EVENT_DELAY_MS,
  CONTENT_CHECK_DELAY_MS,
  ComponentResolver,
  DOM_RENDER_DELAY_MS,
  getErrorMessage,
  logger,
  setupProperty,
} from '@spfx-local-workbench/shared';

import { SpfxContext, ThemeProvider } from './mocks';
import type { IActiveExtension, IExtensionConfig, IVsCodeApi, IWebPartManifest } from './types';

// PlaceholderName enum matching @microsoft/sp-application-base
enum PlaceholderName {
  Top = 0,
  Bottom = 1,
}

// Mock PlaceholderContent that wraps an actual DOM element
class MockPlaceholderContent {
  private _disposed = false;

  constructor(
    public name: PlaceholderName,
    public domElement: HTMLDivElement,
  ) {}

  public dispose(): void {
    this._disposed = true;
    if (this.domElement) {
      this.domElement.innerHTML = '';
    }
  }

  public get isDisposed(): boolean {
    return this._disposed;
  }
}

export class ExtensionManager {
  private log = logger.createChild('ExtensionManager');
  private bundleLoader: BundleLoader;
  private componentResolver: ComponentResolver;
  private contextProvider: SpfxContext;
  private themeProvider: ThemeProvider;

  constructor(
    _vscode: IVsCodeApi,
    serveUrl: string,
    contextProvider: SpfxContext,
    themeProvider: ThemeProvider,
  ) {
    this.bundleLoader = new BundleLoader(serveUrl);
    this.componentResolver = new ComponentResolver();
    this.contextProvider = contextProvider;
    this.themeProvider = themeProvider;
  }

  async loadExtensionBundle(manifest: IWebPartManifest): Promise<string[]> {
    return this.bundleLoader.loadBundle(manifest);
  }

  async instantiateExtension(
    config: IExtensionConfig,
    headerElement: HTMLDivElement,
    footerElement: HTMLDivElement,
  ): Promise<IActiveExtension | undefined> {
    try {
      const newModules = await this.loadExtensionBundle(config.manifest);
      await new Promise((r) => setTimeout(r, DOM_RENDER_DELAY_MS));

      const context = this.createExtensionContext(
        config.manifest.id,
        config.instanceId,
        headerElement,
        footerElement,
      );

      const ExtensionClass = this.findExtensionClass(config.manifest, newModules);

      if (ExtensionClass && typeof ExtensionClass === 'function') {
        return await this.renderExtensionFromClass(
          ExtensionClass,
          config,
          context,
          headerElement,
          footerElement,
        );
      }

      // Show debug info if couldn't find the class
      this.showDebugInfo(headerElement, config.manifest);
      return;
    } catch (error: unknown) {
      this.log.error('Failed to load extension:', error);
      headerElement.innerHTML = `<div class="error-message">Failed to load extension: ${getErrorMessage(error)}</div>`;
      return;
    }
  }

  private createExtensionContext(
    extensionId: string,
    instanceId: string,
    headerElement: HTMLDivElement,
    footerElement: HTMLDivElement,
  ): any {
    const baseContext = this.contextProvider.createMockContext(extensionId, instanceId);

    // Create mock placeholders for header and footer
    const topPlaceholder = new MockPlaceholderContent(PlaceholderName.Top, headerElement);
    const bottomPlaceholder = new MockPlaceholderContent(PlaceholderName.Bottom, footerElement);

    // Mock changedEvent - Application Customizers subscribe to this
    // to know when placeholders become available
    const changedEventHandlers: Array<{ thisArg: any; handler: Function }> = [];
    const changedEvent = {
      add: (thisArg: any, handler: Function) => {
        changedEventHandlers.push({ thisArg, handler });
      },
      remove: (_thisArg: any, _handler: Function) => {
        // no-op for mock
      },
    };

    // Mock placeholderProvider - this is what Application Customizers use
    // to access the Top and Bottom placeholders
    const placeholderProvider = {
      placeholderNames: [
        PlaceholderName[PlaceholderName.Top],
        PlaceholderName[PlaceholderName.Bottom],
      ],
      changedEvent: changedEvent,
      tryCreateContent: (name: PlaceholderName, _options?: any) => {
        if (name === PlaceholderName.Top) {
          return topPlaceholder;
        } else if (name === PlaceholderName.Bottom) {
          return bottomPlaceholder;
        }
        return null;
      },
    };

    // Fire changedEvent after a short delay so handlers registered in onInit get called
    setTimeout(() => {
      changedEventHandlers.forEach(({ thisArg, handler }) => {
        try {
          handler.call(thisArg);
        } catch (error: unknown) {
          this.log.warn('Error in changedEvent handler:', error);
        }
      });
    }, CHANGED_EVENT_DELAY_MS);

    return {
      ...baseContext,
      placeholderProvider: placeholderProvider,
    };
  }

  private findExtensionClass(manifest: IWebPartManifest, candidateModules?: string[]): any {
    return this.componentResolver.findComponentClass(manifest, candidateModules);
  }

  private async renderExtensionFromClass(
    ExtensionClass: any,
    config: IExtensionConfig,
    context: any,
    headerElement: HTMLDivElement,
    footerElement: HTMLDivElement,
  ): Promise<IActiveExtension> {
    try {
      const instance = new ExtensionClass();
      const active: IActiveExtension = {
        ...config,
        context,
        instance,
        headerDomElement: headerElement,
        footerDomElement: footerElement,
      };

      // Set up the instance with our mock context
      instance._context = active.context;
      setupProperty(instance, 'context', () => active.context);

      instance._properties = active.properties;
      setupProperty(
        instance,
        'properties',
        () => active.properties,
        (val: any) => {
          active.properties = val;
          instance._properties = val;
        },
      );

      // Call onInit - Application Customizers do their work in onInit
      // They use this.context.placeholderProvider.tryCreateContent() to get
      // DOM elements for header/footer rendering
      if (typeof instance.onInit === 'function') {
        try {
          const initResult = instance.onInit();
          if (initResult && typeof initResult.then === 'function') {
            await initResult;
          }
        } catch (error: unknown) {
          this.log.warn('Error in onInit:', error);
        }
      }

      // Apply theme
      this.themeProvider.applyThemeToWebPart(headerElement);
      this.themeProvider.applyThemeToWebPart(footerElement);

      // Check if content was rendered
      setTimeout(() => {
        const hasHeaderContent = headerElement.innerHTML.trim().length > 0;
        const hasFooterContent = footerElement.innerHTML.trim().length > 0;

        if (!hasHeaderContent && !hasFooterContent) {
          // Extension rendered but no placeholder content was created.
          // This is normal if the extension uses conditional rendering.
        }
      }, CONTENT_CHECK_DELAY_MS);

      return active;
    } catch (error: unknown) {
      this.log.error('Setup error:', error);
      headerElement.innerHTML = `<div class="error-message">Extension setup error: ${getErrorMessage(error)}</div>`;
      throw error;
    }
  }

  private showDebugInfo(domElement: HTMLElement, manifest: IWebPartManifest): void {
    let debugHtml = '<div style="padding:12px;color:#605e5c;font-size:13px;">';
    debugHtml += `<p><strong>${manifest.alias}</strong> extension bundle loaded.</p>`;
    debugHtml += '<p style="color:#a80000;">Could not find Application Customizer class.</p>';
    debugHtml += `<p><strong>Manifest ID:</strong> ${manifest.id}</p>`;
    debugHtml += '<p><strong>Available modules:</strong></p>';
    debugHtml += '<ul style="font-size:11px;max-height:150px;overflow:auto;">';

    const moduleNames = this.componentResolver.getModuleNames();
    for (const name of moduleNames) {
      const mod = this.componentResolver.getModule(name);
      const modType = typeof mod;
      const modKeys = mod ? Object.keys(mod).slice(0, 5).join(', ') : 'null';
      debugHtml += `<li><strong>${name}</strong>: ${modType} [${modKeys}]</li>`;
    }
    debugHtml += '</ul>';
    debugHtml += '</div>';
    domElement.innerHTML = debugHtml;
  }
}
