import type { IClientSideComponentManifest } from '../types';

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
  async loadStrings(
    manifest: IClientSideComponentManifest,
    localeOverride?: string,
  ): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('StringsLoader requires browser environment');
    }

    const scriptResources = manifest.loaderConfig?.scriptResources;
    if (!scriptResources) {
      return;
    }

    // Find every localized strings resource. A bundle can have several (e.g. its own strings
    // plus ControlStrings from @pnp/spfx-controls-react), and all of them must be registered.
    const resources = this.findStringsResources(
      scriptResources,
      manifest.loaderConfig?.entryModuleId,
      localeOverride,
    );

    const baseUrl = manifest.loaderConfig?.internalModuleBaseUrls?.[0] || `${this.serveUrl}/`;

    // Load sequentially: each script defines an anonymous module that is mapped to its name on load
    for (const { moduleName, path } of resources) {
      await this.loadStringsModule(baseUrl + path, moduleName);
    }
  }

  /**
   * Load one localized strings script and register its anonymous AMD module under moduleName
   */
  private loadStringsModule(fullUrl: string, moduleName: string): Promise<void> {
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
   * Find all strings resources in script resources
   * @param scriptResources - Script resources from manifest
   * @param entryModuleId - Entry module ID (to skip main bundle)
   * @param localeOverride - Optional locale override
   * @returns Module name and path for each strings resource
   */
  private findStringsResources(
    scriptResources: Record<string, any>,
    entryModuleId?: string,
    localeOverride?: string,
  ): { moduleName: string; path: string }[] {
    const found: { moduleName: string; path: string }[] = [];

    for (const [name, resource] of Object.entries(scriptResources)) {
      // Case 1: Served without locale parameter - manifest has 'localizedPath' type
      if (resource.type === 'localizedPath') {
        const path = this.resolveLocalizedPath(resource, localeOverride);
        if (path) {
          found.push({ moduleName: name, path });
        }
        continue;
      }

      // Case 2: Served with locale parameter - manifest has 'path' type for strings.
      // Only names ending in "Strings" are localization modules; other 'path' resources are bundles.
      if (
        resource.type === 'path' &&
        name !== entryModuleId &&
        /Strings$/.test(name) &&
        resource.path
      ) {
        found.push({ moduleName: name, path: resource.path });
      }
    }

    return found;
  }

  /**
   * Resolve the script path of a 'localizedPath' resource. Supports both the expanded form
   * ({ paths: { 'en-US': '...' }, defaultPath }) and the compact form gulp serve emits
   * ({ paths: { p: 'AllStrings_', l: { 'en-US': 'en-us' }, s: '.js' }, defaultPath }).
   */
  private resolveLocalizedPath(resource: any, localeOverride?: string): string | null {
    const paths = resource.paths;
    const compact = paths && typeof paths.p === 'string' && paths.l && typeof paths.l === 'object';
    const locales: Record<string, string> = compact ? paths.l : paths || {};

    if (localeOverride) {
      const localeKey = Object.keys(locales).find(
        (key) => key.toLowerCase() === localeOverride.toLowerCase(),
      );
      if (localeKey) {
        return compact ? `${paths.p}${locales[localeKey]}${paths.s || '.js'}` : locales[localeKey];
      }
    }

    return resource.defaultPath || null;
  }
}

/**
 * Create a StringsLoader instance
 * @param serveUrl - Base URL for the dev server
 */
export function createStringsLoader(serveUrl: string): StringsLoader {
  return new StringsLoader(serveUrl);
}
