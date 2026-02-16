import type { IScriptResource } from './IScriptResource';

/**
 * Loader configuration for SPFx bundles
 * Defines how to load the component's JavaScript bundle and dependencies
 */
export interface ILoaderConfig {
  /** Entry module identifier (typically the component ID) */
  entryModuleId?: string;

  /** Base URLs for internal modules (typically [serveUrl + '/dist/']) */
  internalModuleBaseUrls?: string[];

  /** Script resources including bundles, localized strings, and dependencies */
  scriptResources?: Record<string, IScriptResource>;
}
