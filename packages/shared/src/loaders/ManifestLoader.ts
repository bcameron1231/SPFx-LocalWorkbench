import type { IWebPartManifest } from '../types';

/**
 * ManifestLoader
 * Loads SPFx component manifests from the build output
 *
 * NOTE: This class requires browser environment (window, document)
 */
export class ManifestLoader {
  private serveUrl: string;

  constructor(serveUrl: string) {
    this.serveUrl = serveUrl;
  }

  /**
   * Load manifests.js and extract component manifests
   * @returns Array of manifests for all components (web parts + extensions)
   */
  async loadManifests(): Promise<IWebPartManifest[]> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('ManifestLoader requires browser environment');
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.serveUrl + '/temp/build/manifests.js?_v=' + Date.now();

      script.onload = () => {
        const win = window as any;
        if (win.debugManifests?.getManifests) {
          const manifests = win.debugManifests.getManifests();

          // Update internal module base URLs to match serve URL
          // Preserves the path (e.g., /dist/) so bundle paths resolve correctly
          manifests.forEach((manifest: IWebPartManifest) => {
            if (manifest.loaderConfig?.internalModuleBaseUrls) {
              manifest.loaderConfig.internalModuleBaseUrls =
                manifest.loaderConfig.internalModuleBaseUrls.map((url: string) => {
                  try {
                    const original = new URL(url);
                    const serve = new URL(this.serveUrl);
                    original.protocol = serve.protocol;
                    original.hostname = serve.hostname;
                    original.port = serve.port;
                    return original.toString();
                  } catch {
                    return this.serveUrl + '/';
                  }
                });
            }
          });

          resolve(manifests);
        } else {
          reject(new Error('debugManifests not available'));
        }
      };

      script.onerror = () => reject(new Error('Failed to load manifests.js'));
      document.head.appendChild(script);
    });
  }
}

/**
 * Create a ManifestLoader instance
 * @param serveUrl - Base URL for the dev server
 */
export function createManifestLoader(serveUrl: string): ManifestLoader {
  return new ManifestLoader(serveUrl);
}
