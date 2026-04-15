import { loadTheme as loadFluentUiTheme } from '@fluentui/react';
import { useChannel, useGlobals } from '@storybook/preview-api';
import type { Decorator, StoryContext } from '@storybook/react';
import React, { useEffect, useRef, useState } from 'react';

import {
  BrowserProxyTransport,
  DEFAULT_THEME_NAME,
  type ITheme,
  type IWebPartManifest,
  ProxyAadHttpClient,
  ProxyHttpClient,
  ProxySPHttpClient,
  StatusRenderer,
  buildMockPageContext,
  buildThemeList,
  loadTheme,
} from '@spfx-local-workbench/shared';
import {
  applyPaletteAsCssVars,
  buildFlatTheme,
  buildFluentTheme,
} from '@spfx-local-workbench/shared/fluent';

import { DisplayMode, EVENTS, PARAM_KEY, STORYBOOK_GLOBAL_KEYS } from '../constants';
import { SpfxContextProvider } from '../context/SpfxContext';
import { mergePageContext } from '../defaults';
import type { ISpfxParameters } from '../types';
import { loadComponent as loadSpfxComponent } from '../utils/componentLoader';
import styles from './withSpfx.module.css';

/**
 * Create a mock HTTP client for SPFx context
 */
function createMockHttpClient(): any {
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

/**
 * Create a mock SharePoint HTTP client for SPFx context
 */
function createMockSpHttpClient(): any {
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

/**
 * Install a fetch interceptor that routes API requests through BrowserProxyTransport.
 * Similar to webview/src/proxy/ProxyFetchClient.ts but routes through BrowserProxyTransport
 * instead of ProxyBridge (VS Code postMessage).
 */
function installFetchInterceptor(transport: BrowserProxyTransport): void {
  // Save the original fetch if not already saved
  if (!(window as any).__originalFetch) {
    (window as any).__originalFetch = window.fetch.bind(window);
  }

  const originalFetch = (window as any).__originalFetch;

  // Intercept fetch calls
  window.fetch = async function interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || 'GET';

    // Check if this request should be proxied (matches /_api/ or /_vti_bin/)
    if (url.includes('/_api/') || url.includes('/_vti_bin/')) {
      try {
        const headers = extractHeaders(init?.headers);
        const body = serializeBody(init?.body);

        // Send through BrowserProxyTransport
        const proxyResponse = await transport.sendRequest({
          id: `fetch-${Date.now()}`,
          url,
          method,
          headers,
          body,
          clientType: 'fetch',
        });

        // Convert proxy response to native Response (match workbench ProxyFetchClient pattern)
        const responseBody = proxyResponse.body || '{}';
        const responseHeaders = new Headers(proxyResponse.headers || {});

        return new Response(responseBody, {
          status: proxyResponse.status,
          statusText: proxyResponse.status >= 200 && proxyResponse.status < 300 ? 'OK' : 'Error',
          headers: responseHeaders,
        });
      } catch (error) {
        console.warn('[FetchInterceptor] Proxy error, falling back to network:', error);
        // Fall through to real fetch if proxy fails
      }
    }

    // Pass through to original fetch for non-API requests
    return originalFetch.call(window, input, init);
  };
}

function extractHeaders(raw: HeadersInit | undefined): Record<string, string> | undefined {
  if (!raw) {
    return undefined;
  }
  const headers: Record<string, string> = {};
  if (raw instanceof Headers) {
    raw.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(raw)) {
    for (const [key, value] of raw) {
      headers[key] = value;
    }
  } else {
    return raw as Record<string, string>;
  }
  return headers;
}

function serializeBody(raw: BodyInit | null | undefined): string | undefined {
  // eslint-disable-next-line eqeqeq -- nullish check for both null and undefined
  if (raw == null) {
    return undefined;
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (raw instanceof ArrayBuffer) {
    return new TextDecoder().decode(raw);
  }
  if (raw instanceof Uint8Array) {
    return new TextDecoder().decode(raw);
  }
  if (typeof raw.toString === 'function') {
    return raw.toString();
  }
  return String(raw);
}

/**
 * SPFx decorator that wraps stories with SPFx context
 */
export const withSpfx: Decorator = (Story, context: StoryContext) => {
  const parameters = context.parameters[PARAM_KEY] as ISpfxParameters | undefined;
  const [globals, updateGlobals] = useGlobals();

  if (!parameters?.componentId) {
    return (
      <div className={styles.errorContainer}>
        <h3>SPFx Configuration Required</h3>
        <p>This story requires SPFx parameters. Add them to your story:</p>
        <pre className={styles.codeBlock}>
          {`parameters: {
  spfx: {
    componentId: 'your-component-id',
    properties: { /* initial props */ }
  }
}`}
        </pre>
      </div>
    );
  }

  // Read displayMode from globals (managed by the toolbar)
  const globalDisplayMode = globals[STORYBOOK_GLOBAL_KEYS.DISPLAY_MODE];
  const globalThemeName = globals[STORYBOOK_GLOBAL_KEYS.THEME];
  const globalCustomThemes: ITheme[] = globals[STORYBOOK_GLOBAL_KEYS.CUSTOM_THEMES] ?? [];
  const storyThemes: ITheme[] = parameters?.customThemes ?? [];
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    globalDisplayMode || parameters.displayMode || DisplayMode.Edit,
  );
  const [themeName, setThemeName] = useState<string>(
    globalThemeName || parameters.themeName || DEFAULT_THEME_NAME,
  );
  const [locale, setLocale] = useState<string>(parameters.locale || 'en-US');
  // Properties are seeded from the serve's manifest preconfiguredEntry once loaded;
  // parameters.properties acts only as a fallback when the entry has none.
  const [properties, setProperties] = useState<Record<string, any>>(parameters.properties || {});
  const [propertiesSeeded, setPropertiesSeeded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const componentInstanceRef = useRef<any>(null);
  const proxyTransportRef = useRef<BrowserProxyTransport | null>(null);

  // Initialize proxy transport on mount
  useEffect(() => {
    // Create transport instance (uses default /proxy/ paths)
    proxyTransportRef.current = new BrowserProxyTransport();

    // Initialize the transport to load mock configuration
    proxyTransportRef.current
      .initialize()
      .then(() => {
        installFetchInterceptor(proxyTransportRef.current!);
      })
      .catch((error) => {
        console.warn('[withSpfx] Proxy initialization failed:', error.message || error);
        console.warn('[withSpfx] API mocking will not be available.');
      });

    // Cleanup: restore original fetch on unmount
    return () => {
      if ((window as any).__originalFetch) {
        window.fetch = (window as any).__originalFetch;
        delete (window as any).__originalFetch;
      }
    };
  }, []);

  // Reset seed flag whenever the story target changes so the new manifest entry's
  // properties are picked up from the serve on the next load.
  useEffect(() => {
    setPropertiesSeeded(false);
  }, [parameters.componentId, parameters.preconfiguredEntryIndex]);

  // Update displayMode when global changes
  useEffect(() => {
    if (globalDisplayMode !== undefined) {
      setDisplayMode(globalDisplayMode);
    }
  }, [globalDisplayMode]);

  // Update themeName when global changes
  useEffect(() => {
    if (globalThemeName !== undefined) {
      setThemeName(globalThemeName);
    }
  }, [globalThemeName]);

  // When the story declares a preferred theme, push it to the global so the
  // toolbar reflects it. Stories with no themeName are theme-agnostic and leave
  // the global untouched, inheriting whatever the user or the `spfxTheme` global set.
  useEffect(() => {
    if (parameters.themeName) {
      updateGlobals({ [STORYBOOK_GLOBAL_KEYS.THEME]: parameters.themeName });
    }
  }, [parameters.themeName]);

  // Listen to events from toolbar and panels
  const emit = useChannel({
    [EVENTS.LOCALE_CHANGED]: (newLocale: string) => {
      setLocale(newLocale);
    },
    [EVENTS.UPDATE_PROPERTIES]: (newProperties: Record<string, any>) => {
      setProperties(newProperties);
    },
  });

  // Load and render the SPFx component
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const loadComponent = async () => {
      try {
        const serveUrl = parameters.serveUrl || 'https://localhost:4321';

        // Merge provided context with defaults (uses shared defaults from defaults.ts)
        const contextConfig = mergePageContext(parameters.context?.pageContext, locale);

        // Build mock pageContext with all computed properties (uses shared builder)
        const mockPageContext = buildMockPageContext(contextConfig);

        // Resolve and pre-apply the theme BEFORE loading the bundle so that the
        // inline copy of @microsoft/load-themed-styles (bundled inside the web part)
        // finds window.__themeState__.theme already populated when it calls loadStyles.
        const allThemesEarly = buildThemeList(storyThemes, globalCustomThemes);
        const currentThemeEarly =
          allThemesEarly.find((t) => t.name === themeName) ?? allThemesEarly[0];
        applyPaletteAsCssVars(
          document.body,
          currentThemeEarly.palette,
          currentThemeEarly.isInverted,
        );
        loadTheme(buildFlatTheme(currentThemeEarly.palette, currentThemeEarly.isInverted));
        loadFluentUiTheme(
          buildFluentTheme(currentThemeEarly.palette, currentThemeEarly.isInverted),
        );

        // Load the component using the proper component loader
        const { manifest: rawManifest, componentClass: ComponentClass } = await loadSpfxComponent(
          parameters.componentId,
          serveUrl,
          locale,
        );
        // withSpfx is web-part–specific; cast to access preconfiguredEntries.
        const manifest = rawManifest as IWebPartManifest;

        // Resolve initial properties: start from the manifest's preconfiguredEntry
        // then merge story-level parameters.properties on top so individual stories
        // can override specific keys without replacing the whole property bag.
        const entryIndex = parameters.preconfiguredEntryIndex ?? 0;
        const serveProperties = manifest.preconfiguredEntries?.[entryIndex]?.properties ?? {};
        const resolvedProperties = { ...serveProperties, ...parameters.properties };

        // Seed React state once per component load so downstream effects see the correct values.
        if (!propertiesSeeded) {
          setProperties(resolvedProperties);
          setPropertiesSeeded(true);
        }

        // Create component instance
        const instance = new ComponentClass();
        componentInstanceRef.current = instance;

        // Set up the component with getters (similar to WebPartManager)
        instance._context = undefined;
        instance._domElement = containerRef.current;
        instance._properties = resolvedProperties;
        instance._displayMode = displayMode;

        // Define property getters
        Object.defineProperty(instance, 'context', {
          get: () => instance._context,
          set: (val: any) => {
            instance._context = val;
          },
          configurable: true,
          enumerable: true,
        });

        Object.defineProperty(instance, 'domElement', {
          get: () => instance._domElement,
          configurable: true,
          enumerable: true,
        });

        Object.defineProperty(instance, 'properties', {
          get: () => instance._properties,
          set: (val: any) => {
            instance._properties = val;
          },
          configurable: true,
          enumerable: true,
        });

        Object.defineProperty(instance, 'displayMode', {
          get: () => instance._displayMode,
          configurable: true,
          enumerable: true,
        });

        // Set up the component context (mock SPFx context)
        // Match the structure from webview/src/mocks/SpfxContext.ts
        // Use proxy-aware HTTP clients if transport is initialized, otherwise fall back to stubs
        const transport = proxyTransportRef.current;
        const httpClient = transport ? new ProxyHttpClient(transport) : createMockHttpClient();
        const spHttpClient = transport
          ? new ProxySPHttpClient(transport)
          : createMockSpHttpClient();

        instance._context = {
          pageContext: mockPageContext,
          manifest: {
            id: manifest.id,
            alias: manifest.alias,
          },
          domElement: containerRef.current,
          displayMode: displayMode,
          sdks: {
            microsoftTeams: undefined, // Not running in Teams context
          },
          serviceScope: {
            consume: () => ({}),
            createChildScope: () => ({
              consume: () => ({}),
              finish: () => {},
            }),
            finish: () => {},
          },
          httpClient: httpClient,
          spHttpClient: spHttpClient,
          aadHttpClientFactory: {
            getClient: () =>
              Promise.resolve(
                transport ? new ProxyAadHttpClient(transport) : createMockHttpClient(),
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
          isServedFromLocalhost: true,
          propertyPane: {
            refresh: () => {},
            open: () => {},
            close: () => {},
            isRenderedByWebPart: () => true,
            isPropertyPaneOpen: () => false,
          },
          statusRenderer: new StatusRenderer(),
        };

        // Call onInit if it exists
        if (typeof instance.onInit === 'function') {
          try {
            const initResult = instance.onInit();
            if (initResult && typeof initResult.then === 'function') {
              await initResult;
            }
          } catch (e: any) {
            console.error('onInit error:', e);
          }
        }

        // Apply theme before first render so the web part sees the correct palette
        // from the start — mirrors the workbench order: CSS vars → onThemeChanged → render().
        // Call loadTheme again *after* the bundle has loaded so that _syncInlineThemeState
        // runs over the now-populated registeredThemableStyles and back-fills any style
        // elements the inline copy of @microsoft/load-themed-styles already injected with
        // real palette values (rather than the var() fallback / default hex).
        applyPaletteAsCssVars(
          document.body,
          currentThemeEarly.palette,
          currentThemeEarly.isInverted,
        );
        loadTheme(buildFlatTheme(currentThemeEarly.palette, currentThemeEarly.isInverted));

        // Notify the web part of the initial theme via the SPFx onThemeChanged lifecycle.
        // This MUST happen before render() so _themeColors / isDarkTheme are correct for
        // the first paint.
        if (typeof instance.onThemeChanged === 'function') {
          try {
            instance.onThemeChanged(
              buildFluentTheme(currentThemeEarly.palette, currentThemeEarly.isInverted),
            );
          } catch (e: any) {
            console.warn('onThemeChanged error:', e);
          }
        }

        // Render the component — theme is already applied above.
        instance.render();

        // Emit property changes when they happen
        if (instance.onPropertyPaneFieldChanged) {
          const originalHandler = instance.onPropertyPaneFieldChanged.bind(instance);
          instance.onPropertyPaneFieldChanged = (
            propertyPath: string,
            oldValue: any,
            newValue: any,
          ) => {
            originalHandler(propertyPath, oldValue, newValue);
            emit(EVENTS.PROPERTY_CHANGED, { propertyPath, oldValue, newValue });
          };
        }
      } catch (error) {
        console.error('Failed to load SPFx component:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="padding: 20px; color: #d13438; border: 1px solid #d13438; border-radius: 4px;">
              <h3>Failed to Load Component</h3>
              <p>${error instanceof Error ? error.message : String(error)}</p>
              <p style="margin-top: 10px; font-size: 12px; color: #666;">
                Make sure your SPFx project is running (npm run start)
              </p>
            </div>
          `;
        }
      }
    };

    loadComponent();

    // Cleanup
    return () => {
      if (componentInstanceRef.current?.onDispose) {
        componentInstanceRef.current.onDispose();
      }
      componentInstanceRef.current = null;
    };
  }, [parameters.componentId, parameters.serveUrl]);

  // Update component when properties, display mode, theme, or locale change
  useEffect(() => {
    const instance = componentInstanceRef.current;
    if (!instance) return;

    // Resolve the current theme from all sources
    const allThemes = buildThemeList(storyThemes, globalCustomThemes);
    const currentTheme = allThemes.find((t) => t.name === themeName) ?? allThemes[0];

    // Apply to document.body so the Storybook canvas background matches the theme.
    applyPaletteAsCssVars(document.body, currentTheme.palette, currentTheme.isInverted);
    // Populate __themeState__.theme with the full flat theme (palette + semantic colors +
    // flattened font ramp + effects) so [theme:token] CSS tokens resolve correctly.
    loadTheme(buildFlatTheme(currentTheme.palette, currentTheme.isInverted));
    // Update @fluentui/react's global theme registry so Fluent UI controls inside the
    // web part (SearchBox, Dropdown, etc.) render in the selected theme.
    loadFluentUiTheme(buildFluentTheme(currentTheme.palette, currentTheme.isInverted));

    // Notify the web part of the theme change
    if (typeof instance.onThemeChanged === 'function') {
      try {
        instance.onThemeChanged(buildFluentTheme(currentTheme.palette, currentTheme.isInverted));
      } catch (e: any) {
        console.warn('onThemeChanged error:', e);
      }
    }

    instance._properties = properties;
    instance._displayMode = displayMode;
    if (instance._context) {
      instance._context.displayMode = displayMode;
    }
    instance.render();
  }, [properties, displayMode, themeName, locale]);

  return (
    <SpfxContextProvider
      componentId={parameters.componentId}
      displayMode={displayMode}
      themeName={themeName}
      locale={locale}
      properties={properties}
    >
      <div ref={containerRef} className={styles.componentContainer} />
    </SpfxContextProvider>
  );
};
