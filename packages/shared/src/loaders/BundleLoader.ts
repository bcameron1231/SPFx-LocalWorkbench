import type { IWebPartManifest } from '../types';

/**
 * BundleLoader
 * Loads SPFx component JavaScript bundles
 */
export class BundleLoader {
  private serveUrl: string;

  constructor(serveUrl: string) {
    this.serveUrl = serveUrl;
  }

  /**
   * Load a component's JavaScript bundle
   * @param manifest - Component manifest containing loader config
   * @returns Promise that resolves when bundle is loaded
   */
  async loadBundle(manifest: IWebPartManifest): Promise<void> {
    const bundlePath = this.getBundlePath(manifest);
    const baseUrl = manifest.loaderConfig?.internalModuleBaseUrls?.[0] || (this.serveUrl + '/');
    const fullUrl = baseUrl + bundlePath;
    
    // Cache-bust so live reload always fetches the freshly compiled bundle
    const cacheBustedUrl = fullUrl + (fullUrl.includes('?') ? '&' : '?') + '_v=' + Date.now();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = cacheBustedUrl;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load ' + fullUrl));
      document.head.appendChild(script);
    });
  }

  /**
   * Extract bundle path from manifest
   * @param manifest - Component manifest
   * @returns Relative bundle path
   */
  private getBundlePath(manifest: IWebPartManifest): string {
    if (manifest.loaderConfig?.scriptResources) {
      const entryId = manifest.loaderConfig.entryModuleId;
      const entry = entryId ? manifest.loaderConfig.scriptResources[entryId] : null;
      
      if (entry?.paths?.default) {
        return entry.paths.default;
      } else if (entry?.path) {
        return entry.path;
      }
    }

    // Fallback to convention-based path
    const componentType = manifest.componentType || 'WebPart';
    if (componentType === 'Extension') {
      return 'dist/' + manifest.alias.toLowerCase() + '.js';
    } else {
      return manifest.alias.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() + '.js';
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
