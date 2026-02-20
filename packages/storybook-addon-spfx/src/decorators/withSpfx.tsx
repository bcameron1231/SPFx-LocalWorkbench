import { useChannel, useGlobals } from '@storybook/preview-api';
import type { Decorator, StoryContext } from '@storybook/react';
import React, { useEffect, useRef, useState } from 'react';

import { MICROSOFT_THEMES, buildMockPageContext } from '@spfx-local-workbench/shared';

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
 * SPFx decorator that wraps stories with SPFx context
 */
export const withSpfx: Decorator = (Story, context: StoryContext) => {
  const parameters = context.parameters[PARAM_KEY] as ISpfxParameters | undefined;
  const [globals] = useGlobals();

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
  const globalThemeId = globals[STORYBOOK_GLOBAL_KEYS.THEME];
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    globalDisplayMode || parameters.displayMode || DisplayMode.Edit,
  );
  const [themeId, setThemeId] = useState<string>(globalThemeId || parameters.themeId || 'teal');
  const [locale, setLocale] = useState<string>(parameters.locale || 'en-US');
  const [properties, setProperties] = useState<Record<string, any>>(parameters.properties || {});

  const containerRef = useRef<HTMLDivElement>(null);
  const componentInstanceRef = useRef<any>(null);

  // Update displayMode when global changes
  useEffect(() => {
    if (globalDisplayMode !== undefined) {
      setDisplayMode(globalDisplayMode);
    }
  }, [globalDisplayMode]);

  // Update themeId when global changes
  useEffect(() => {
    if (globalThemeId !== undefined) {
      setThemeId(globalThemeId);
      console.log(`Global theme changed to: ${globalThemeId}`);
    }
  }, [globalThemeId]);

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

        // Load the component using the proper component loader
        const { manifest, componentClass: ComponentClass } = await loadSpfxComponent(
          parameters.componentId,
          serveUrl,
          locale,
        );

        // Create component instance
        const instance = new ComponentClass();
        componentInstanceRef.current = instance;

        // Set up the component with getters (similar to WebPartManager)
        instance._context = undefined;
        instance._domElement = containerRef.current;
        instance._properties = properties;
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
        const currentTheme = MICROSOFT_THEMES.find((t) => t.id === themeId) || MICROSOFT_THEMES[0];

        instance._context = {
          pageContext: mockPageContext,
          manifest: {
            id: manifest.id,
            alias: manifest.alias,
          },
          domElement: containerRef.current,
          displayMode: displayMode,
          theme: currentTheme.palette,
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
          httpClient: createMockHttpClient(),
          spHttpClient: createMockSpHttpClient(),
          aadHttpClientFactory: {
            getClient: () => Promise.resolve(createMockHttpClient()),
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

        // Render the component
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
    };
  }, [parameters.componentId, parameters.serveUrl]);

  // Update component when properties, display mode, theme, or locale change
  useEffect(() => {
    if (componentInstanceRef.current) {
      // Update theme in context
      const currentTheme = MICROSOFT_THEMES.find((t) => t.id === themeId) || MICROSOFT_THEMES[0];
      if (componentInstanceRef.current._context) {
        componentInstanceRef.current._context.theme = currentTheme.palette;
      }

      componentInstanceRef.current._properties = properties;
      componentInstanceRef.current._displayMode = displayMode;
      if (componentInstanceRef.current._context) {
        componentInstanceRef.current._context.displayMode = displayMode;
      }
      componentInstanceRef.current.render();
    }
  }, [properties, displayMode, themeId, locale]);

  return (
    <SpfxContextProvider
      componentId={parameters.componentId}
      displayMode={displayMode}
      themeId={themeId}
      locale={locale}
      properties={properties}
    >
      <div ref={containerRef} className={styles.componentContainer} />
    </SpfxContextProvider>
  );
};
