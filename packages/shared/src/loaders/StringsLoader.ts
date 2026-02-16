import type { IWebPartManifest } from '../types';

/**
 * StringsLoader
 * Loads localized string resources for SPFx components
 *
 * NOTE: This class requires browser environment (window, document)
 */
export class StringsLoader {
  private serveUrl: string;

  constructor(serveUrl: string) {
    this.serveUrl = serveUrl;
  }

  /**
   * Load localized strings for a component
   * @param manifest - Component manifest
   * @param localeOverride - Optional locale override (e.g., 'en-us', 'de-de')
   * @returns Promise that resolves when strings are loaded
   */
  async loadStrings(manifest: IWebPartManifest, localeOverride?: string): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('StringsLoader requires browser environment');
    }

    const scriptResources = manifest.loaderConfig?.scriptResources;
    if (!scriptResources) {
      return;
    }

    // Find the localized strings resource
    const { moduleName, path } = this.findStringsResource(
      scriptResources,
      manifest.loaderConfig?.entryModuleId,
      localeOverride,
    );

    if (!moduleName || !path) {
      return; // No localized strings found
    }

    const baseUrl = manifest.loaderConfig?.internalModuleBaseUrls?.[0] || `${this.serveUrl}/`;
    const fullUrl = baseUrl + path;
    const cacheBustedUrl = `${fullUrl + (fullUrl.includes('?') ? '&' : '?')}_v=${Date.now()}`;

    return new Promise((resolve, reject) => {
      // Track existing modules to identify newly loaded anonymous module
      const amdModules = (window as any).__amdModules || {};
      const existingModules = new Set(Object.keys(amdModules));

      const script = document.createElement('script');
      script.src = cacheBustedUrl;

      script.onload = () => {
        // Find the newly added anonymous module
        const newModules = Object.keys(amdModules).filter((k) => !existingModules.has(k));
        const anonymousModule = newModules.find((k) => k.startsWith('_anonymous_'));

        if (anonymousModule && moduleName) {
          // Register the anonymous module with the correct name
          amdModules[moduleName] = amdModules[anonymousModule];
        }

        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load ${fullUrl}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Find strings resource in script resources
   * @param scriptResources - Script resources from manifest
   * @param entryModuleId - Entry module ID (to skip main bundle)
   * @param localeOverride - Optional locale override
   * @returns Module name and path for strings resource
   */
  private findStringsResource(
    scriptResources: Record<string, any>,
    entryModuleId?: string,
    localeOverride?: string,
  ): { moduleName: string | null; path: string | null } {
    let moduleName: string | null = null;
    let path: string | null = null;

    for (const [name, resource] of Object.entries(scriptResources)) {
      // Case 1: Served without locale parameter - manifest has 'localizedPath' type
      if (resource.type === 'localizedPath') {
        moduleName = name;
        if (localeOverride && resource.paths) {
          // Try to find the locale in the paths object (case-insensitive)
          const localeKey = Object.keys(resource.paths).find(
            (key) => key.toLowerCase() === localeOverride.toLowerCase(),
          );
          path = localeKey ? resource.paths[localeKey] : resource.defaultPath;
        } else {
          path = resource.defaultPath;
        }
        break;
      }

      // Case 2: Served with locale parameter - manifest has 'path' type for strings
      if (resource.type === 'path' && name !== entryModuleId) {
        moduleName = name;
        path = resource.path;
        break;
      }
    }

    return { moduleName, path };
  }
}

/**
 * Create a StringsLoader instance
 * @param serveUrl - Base URL for the dev server
 */
export function createStringsLoader(serveUrl: string): StringsLoader {
  return new StringsLoader(serveUrl);
}
