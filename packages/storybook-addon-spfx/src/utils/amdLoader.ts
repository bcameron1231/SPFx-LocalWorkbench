/**
 * AMD module loader utility
 * Bridges SPFx's AMD modules with Storybook's ES module system
 */

import { amdLoader, BundleLoader, StringsLoader, ManifestLoader, ComponentResolver } from '@spfx-local-workbench/shared';
import type { IAmdLoader } from '../types';

/**
 * Singleton instances for loaders
 */
let bundleLoader: BundleLoader | null = null;
let stringsLoader: StringsLoader | null = null;
let manifestLoader: ManifestLoader | null = null;
let componentResolver: ComponentResolver | null = null;

/**
 * Initialize the AMD loader and utility loaders
 */
async function initAmdLoader(serveUrl: string): Promise<void> {
  // Initialize the custom AMD loader (not RequireJS)
  if (!bundleLoader) {
    amdLoader.initialize();
    bundleLoader = new BundleLoader(serveUrl);
    stringsLoader = new StringsLoader(serveUrl);
    manifestLoader = new ManifestLoader(serveUrl);
    componentResolver = new ComponentResolver();
  }
}

/**
 * Configures the AMD loader for SPFx bundles
 * @deprecated Use initAmdLoader instead - no manual configuration needed
 */
export async function configureAmdLoader(serveUrl: string): Promise<void> {
  await initAmdLoader(serveUrl);
}

/**
 * Loads an AMD module and returns it as a Promise
 * @param moduleId - The module ID to load (from AMD registry)
 * @param serveUrl - Base URL for the dev server (not used, kept for compatibility)
 * @returns Promise resolving to the loaded module
 */
export async function loadAmdModule<T = any>(
  moduleId: string,
  serveUrl: string
): Promise<T> {
  await initAmdLoader(serveUrl);

  return new Promise((resolve, reject) => {
    const modules = amdLoader.getModules();
    if (modules[moduleId]) {
      resolve(modules[moduleId]);
    } else {
      reject(new Error(`Module ${moduleId} not found in AMD registry`));
    }
  });
}

/**
 * Preloads SPFx dependencies
 * Note: With custom AMD loader, dependencies are mocked and always available
 */
export async function preloadSpfxDependencies(serveUrl: string): Promise<void> {
  await initAmdLoader(serveUrl);
  // Dependencies are automatically available via mocks in AmdLoader
}
