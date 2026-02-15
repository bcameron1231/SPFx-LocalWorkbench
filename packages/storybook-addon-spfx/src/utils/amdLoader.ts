/**
 * AMD module loader utility
 * Bridges SPFx's AMD modules with Storybook's ES module system
 */

import type { IAmdLoader } from '../types';

/**
 * Promise that tracks RequireJS loading state
 */
let requireJsLoadingPromise: Promise<void> | null = null;

/**
 * Initializes the AMD loader if not already present
 */
async function initAmdLoader(): Promise<void> {
  // If already loaded, return immediately
  if (typeof window.require !== 'undefined' && typeof window.define !== 'undefined') {
    return;
  }

  // If already loading, wait for the existing load to complete
  if (requireJsLoadingPromise) {
    return requireJsLoadingPromise;
  }

  // Load RequireJS and wait for it to be ready
  requireJsLoadingPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load RequireJS'));
    };
    document.head.appendChild(script);
  });

  return requireJsLoadingPromise;
}

/**
 * Configures the AMD loader for SPFx bundles
 */
export async function configureAmdLoader(serveUrl: string): Promise<void> {
  await initAmdLoader();
  
  if (window.require) {
    (window.require as any).config({
      baseUrl: serveUrl,
      paths: {
        '@microsoft/sp-lodash-subset': 'https://unpkg.com/@microsoft/sp-lodash-subset@1.18.2/dist/sp-lodash-subset',
        '@microsoft/sp-core-library': 'https://unpkg.com/@microsoft/sp-core-library@1.18.2/dist/sp-core-library',
        '@microsoft/sp-webpart-base': 'https://unpkg.com/@microsoft/sp-webpart-base@1.18.2/dist/sp-webpart-base',
        '@microsoft/sp-page-context': 'https://unpkg.com/@microsoft/sp-page-context@1.18.2/dist/sp-page-context',
        '@microsoft/sp-property-pane': 'https://unpkg.com/@microsoft/sp-property-pane@1.18.2/dist/sp-property-pane',
        'react': 'https://unpkg.com/react@17.0.2/umd/react.development',
        'react-dom': 'https://unpkg.com/react-dom@17.0.2/umd/react-dom.development',
      },
    });
  }
}

/**
 * Loads an AMD module and returns it as a Promise
 */
export async function loadAmdModule<T = any>(
  moduleId: string,
  serveUrl: string
): Promise<T> {
  await configureAmdLoader(serveUrl);

  return new Promise((resolve, reject) => {
    if (!window.require) {
      reject(new Error('AMD loader (RequireJS) not available'));
      return;
    }

    window.require([moduleId], (module: T) => {
      resolve(module);
    }, (error: any) => {
      reject(new Error(`Failed to load module ${moduleId}: ${error.message || error}`));
    });
  });
}

/**
 * Preloads SPFx dependencies
 */
export async function preloadSpfxDependencies(serveUrl: string): Promise<void> {
  const dependencies = [
    '@microsoft/sp-core-library',
    '@microsoft/sp-lodash-subset',
  ];

  await configureAmdLoader(serveUrl);

  await Promise.all(
    dependencies.map(dep => loadAmdModule(dep, serveUrl))
  );
}
