import type { IClientSideComponentManifest, IScriptResourcePath } from '../types';

/**
 * Resolves an IScriptResourcePath value to a plain string.
 * The schema allows a path to be either a bare string or an object with `path` + optional `integrity`.
 */
function resolvePath(value: IScriptResourcePath | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.path;
}

/**
 * BundleLoader
 * Loads SPFx component JavaScript bundles
 *
 * NOTE: This class requires browser environment (window, document)
 */
export class BundleLoader {
  private serveUrl: string;

  constructor(serveUrl: string) {
    this.serveUrl = serveUrl;
  }

  /**
   * Load a component's JavaScript bundle
   * @param manifest - Component manifest containing loader config
   * @returns Promise that resolves with array of newly added module names
   */
  async loadBundle(manifest: IClientSideComponentManifest): Promise<string[]> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('BundleLoader requires browser environment');
    }

    const bundlePath = this.getBundlePath(manifest);
    const baseUrl = manifest.loaderConfig?.internalModuleBaseUrls?.[0] || `${this.serveUrl}/`;
    const fullUrl = baseUrl + bundlePath;

    // Cache-bust so live reload always fetches the freshly compiled bundle
    const cacheBustedUrl = `${fullUrl + (fullUrl.includes('?') ? '&' : '?')}_v=${Date.now()}`;

    // Track existing modules before loading
    const amdModules = (window as any).__amdModules || {};
    const existingModules = new Set(Object.keys(amdModules));

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = cacheBustedUrl;
      script.onload = () => {
        // Find newly added modules
        const newModules = Object.keys(amdModules).filter((k) => !existingModules.has(k));
        resolve(newModules);
      };
      script.onerror = () => reject(new Error(`Failed to load ${fullUrl}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Extract bundle path from manifest
   * @param manifest - Component manifest
   * @returns Relative bundle path
   */
  private getBundlePath(manifest: IClientSideComponentManifest): string {
    if (manifest.loaderConfig?.scriptResources) {
      const entryId = manifest.loaderConfig.entryModuleId;
      const entry = entryId ? manifest.loaderConfig.scriptResources[entryId] : null;

      if (entry) {
        if (entry.type === 'localizedPath') {
          // Check paths['default'] first (older SPFx builds store the default locale
          // under the key 'default'), then fall back to the proper defaultPath field.
          const fromPaths = resolvePath(
            entry.paths?.['default'] as IScriptResourcePath | undefined,
          );
          return fromPaths ?? resolvePath(entry.defaultPath) ?? '';
        } else if (entry.type === 'path') {
          return resolvePath(entry.path) ?? '';
        }
      }
    }

    // Fallback to convention-based path
    const componentType = manifest.componentType || 'WebPart';
    if (componentType === 'Extension') {
      return `dist/${manifest.alias.toLowerCase()}.js`;
    } else {
      return `${manifest.alias.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.js`;
    }
  }
}

/**
 * Create a BundleLoader instance
 * @param serveUrl - Base URL for the dev server
 */
export function createBundleLoader(serveUrl: string): BundleLoader {
  return new BundleLoader(serveUrl);
}
