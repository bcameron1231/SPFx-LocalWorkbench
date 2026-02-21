/**
 * Component loader utilities for Storybook stories
 * Provides high-level APIs for loading SPFx components
 */
import React from 'react';
import ReactDOM from 'react-dom';

import {
  AMD_REGISTRATION_DELAY_MS,
  BundleLoader,
  ComponentResolver,
  type IClientSideComponentManifest,
  ManifestLoader,
  StringsLoader,
  amdLoader,
  initializeSpfxMocks,
} from '@spfx-local-workbench/shared';

// Debug: Log what we imported at module load time
console.log('[ComponentLoader] Module imports:', {
  amdLoader: {
    type: typeof amdLoader,
    value: amdLoader,
    hasInitialize: amdLoader && typeof amdLoader.initialize === 'function',
    hasInstance: amdLoader && 'instance' in amdLoader,
    keys: amdLoader ? Object.keys(amdLoader) : [],
  },
  BundleLoader: typeof BundleLoader,
  initializeSpfxMocks: typeof initializeSpfxMocks,
});

/**
 * Interface for web part component class
 */

/**
 * Ensure React is available as window globals for SPFx components
 * Storybook uses ES modules, but SPFx expects window.React/ReactDOM
 */
function ensureReactGlobals(): void {
  if (typeof window !== 'undefined') {
    (window as any).React = React;
    (window as any).ReactDOM = ReactDOM;
  }
}

/**
 * Load SPFx manifests from the dev server
 * @param serveUrl - Base URL for the dev server (e.g., 'http://localhost:4321')
 * @returns Array of component manifests
 */
export async function loadSpfxManifests(serveUrl: string): Promise<IClientSideComponentManifest[]> {
  ensureReactGlobals();
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
  manifest: IClientSideComponentManifest,
  serveUrl: string,
): Promise<string[]> {
  ensureReactGlobals();
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
  manifest: IClientSideComponentManifest,
  serveUrl: string,
  locale?: string,
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
export function findComponentClass(
  manifest: IClientSideComponentManifest,
  candidateModules?: string[],
): any {
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
  locale?: string,
): Promise<{ manifest: IClientSideComponentManifest; componentClass: any }> {
  // Ensure React is available as window globals for SPFx
  ensureReactGlobals();

  // Initialize AMD loader
  console.log('[ComponentLoader.loadComponent] Checking amdLoader:', {
    exists: !!amdLoader,
    type: typeof amdLoader,
    hasInitialize: amdLoader && typeof amdLoader.initialize === 'function',
    value: amdLoader,
  });

  if (!amdLoader || typeof amdLoader.initialize !== 'function') {
    console.error('[ComponentLoader.loadComponent] AMD loader validation failed:', {
      amdLoader,
      type: typeof amdLoader,
      hasProperty: amdLoader && 'initialize' in amdLoader,
      initializeType: amdLoader && typeof amdLoader.initialize,
    });
    throw new Error('AMD loader not available');
  }

  console.log('[ComponentLoader.loadComponent] Initializing AMD loader...');
  amdLoader.initialize();
  console.log('[ComponentLoader.loadComponent] AMD loader initialized successfully');

  // Initialize SPFx mocks (base classes, property pane, etc.)
  if (!initializeSpfxMocks || typeof initializeSpfxMocks !== 'function') {
    throw new Error('SpfxMocks initializer not available');
  }
  initializeSpfxMocks();

  // Load manifests
  const manifests = await loadSpfxManifests(serveUrl);

  // Find the requested component
  const manifest = manifests.find((m) => m.id === componentId || m.alias === componentId);

  if (!manifest) {
    throw new Error(`Component ${componentId} not found in manifests`);
  }

  // Load strings and bundle
  await loadComponentStrings(manifest, serveUrl, locale);
  const newModules = await loadComponentBundle(manifest, serveUrl);

  // Wait for AMD registration
  await new Promise((resolve) => setTimeout(resolve, AMD_REGISTRATION_DELAY_MS));

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
