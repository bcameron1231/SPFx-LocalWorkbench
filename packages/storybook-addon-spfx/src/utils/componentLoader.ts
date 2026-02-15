/**
 * Component loader utilities for Storybook stories
 * Provides high-level APIs for loading SPFx components
 */

import { 
  amdLoader, 
  BundleLoader, 
  StringsLoader, 
  ManifestLoader, 
  ComponentResolver,
  type IWebPartManifest 
} from '@spfx-local-workbench/shared';

/**
 * Load SPFx manifests from the dev server
 * @param serveUrl - Base URL for the dev server (e.g., 'http://localhost:4321')
 * @returns Array of component manifests
 */
export async function loadSpfxManifests(serveUrl: string): Promise<IWebPartManifest[]> {
  const loader = new ManifestLoader(serveUrl);
  return loader.loadManifests();
}

/**
 * Load a component bundle
 * @param manifest - Component manifest
 * @param serveUrl - Base URL for the dev server
 * @returns Array of newly added module names
 */
export async function loadComponentBundle(
  manifest: IWebPartManifest,
  serveUrl: string
): Promise<string[]> {
  const loader = new BundleLoader(serveUrl);
  return loader.loadBundle(manifest);
}

/**
 * Load component localized strings
 * @param manifest - Component manifest
 * @param serveUrl - Base URL for the dev server
 * @param locale - Optional locale override (e.g., 'en-us', 'de-de')
 */
export async function loadComponentStrings(
  manifest: IWebPartManifest,
  serveUrl: string,
  locale?: string
): Promise<void> {
  const loader = new StringsLoader(serveUrl);
  await loader.loadStrings(manifest, locale);
}

/**
 * Find and instantiate a component class
 * @param manifest - Component manifest
 * @param candidateModules - Optional array of module names to search (from bundle loading)
 * @returns Component class constructor
 */
export function findComponentClass(manifest: IWebPartManifest, candidateModules?: string[]): any {
  const resolver = new ComponentResolver();
  return resolver.findComponentClass(manifest, candidateModules);
}

/**
 * Load a complete component (manifest, strings, bundle)
 * @param componentId - Component ID or alias
 * @param serveUrl - Base URL for the dev server
 * @param locale - Optional locale override
 * @returns Object with manifest and component class
 */
export async function loadComponent(
  componentId: string,
  serveUrl: string,
  locale?: string
): Promise<{ manifest: IWebPartManifest; componentClass: any }> {
  // Initialize AMD loader
  amdLoader.initialize();

  // Load manifests
  const manifests = await loadSpfxManifests(serveUrl);
  
  // Find the requested component
  const manifest = manifests.find(
    m => m.id === componentId || m.alias === componentId
  );

  if (!manifest) {
    throw new Error(`Component ${componentId} not found in manifests`);
  }

  // Load strings and bundle
  await loadComponentStrings(manifest, serveUrl, locale);
  const newModules = await loadComponentBundle(manifest, serveUrl);

  // Wait a bit for AMD registration
  await new Promise(resolve => setTimeout(resolve, 100));

  // Find and return the component class
  const componentClass = findComponentClass(manifest, newModules);

  if (!componentClass) {
    throw new Error(`Component class not found for ${componentId}`);
  }

  return { manifest, componentClass };
}

/**
 * Get all registered AMD modules
 * Useful for debugging
 */
export function getAmdModules(): Record<string, any> {
  return amdLoader.getModules();
}

/**
 * Get a specific AMD module by name
 * @param moduleName - Name of the module
 */
export function getAmdModule(moduleName: string): any {
  const modules = amdLoader.getModules();
  return modules[moduleName];
}
