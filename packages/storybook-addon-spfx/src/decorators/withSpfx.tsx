import React, { useEffect, useState, useRef } from 'react';
import type { Decorator, StoryContext } from '@storybook/react';
import { useChannel } from '@storybook/preview-api';
import { PARAM_KEY, EVENTS, DisplayMode } from '../constants';
import type { ISpfxParameters } from '../types';
import { SpfxContextProvider } from '../context/SpfxContext';
import { loadAmdModule } from '../utils/amdLoader';
import { mergePageContext } from '../defaults';
import { buildMockPageContext } from '@spfx-local-workbench/shared';

/**
 * SPFx decorator that wraps stories with SPFx context
 */
export const withSpfx: Decorator = (Story, context: StoryContext) => {
  const parameters = context.parameters[PARAM_KEY] as ISpfxParameters | undefined;
  
  if (!parameters?.componentId) {
    return (
      <div style={{ padding: '20px', color: '#d13438' }}>
        <h3>SPFx Configuration Required</h3>
        <p>This story requires SPFx parameters. Add them to your story:</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
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

  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    parameters.displayMode || DisplayMode.Edit
  );
  const [themeId, setThemeId] = useState<string>(parameters.themeId || 'teal');
  const [locale, setLocale] = useState<string>(parameters.locale || 'en-US');
  const [properties, setProperties] = useState<Record<string, any>>(
    parameters.properties || {}
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const componentInstanceRef = useRef<any>(null);

  // Listen to events from toolbar and panels
  const emit = useChannel({
    [EVENTS.DISPLAY_MODE_CHANGED]: (newMode: DisplayMode) => {
      setDisplayMode(newMode);
    },
    [EVENTS.THEME_CHANGED]: (newThemeId: string) => {
      setThemeId(newThemeId);
    },
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
        
        // Load the component module via AMD
        const ComponentClass = await loadAmdModule(
          parameters.componentId,
          serveUrl
        );

        // Create component instance
        const instance = new ComponentClass();
        componentInstanceRef.current = instance;

        // Set up the component context (mock SPFx context)
        instance.context = {
          pageContext: mockPageContext,
          manifest: {
            id: parameters.componentId,
            alias: context.title,
          },
          domElement: containerRef.current,
          displayMode: displayMode,
        };

        // Set properties
        instance.properties = properties;

        // Render the component
        instance.render();

        // Emit property changes when they happen
        if (instance.onPropertyPaneFieldChanged) {
          const originalHandler = instance.onPropertyPaneFieldChanged.bind(instance);
          instance.onPropertyPaneFieldChanged = (propertyPath: string, oldValue: any, newValue: any) => {
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
      componentInstanceRef.current.properties = properties;
      if (componentInstanceRef.current.context) {
        componentInstanceRef.current.context.displayMode = displayMode;
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
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '200px',
        }}
      />
    </SpfxContextProvider>
  );
};
