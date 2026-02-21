import type { IScriptResource } from './IScriptResource';

/**
 * Loader configuration for an SPFx component bundle.
 *
 * Modelled after client-side-component-loader-configuration.schema.json.
 *
 * The schema requires `internalModuleBaseUrls` to be present (and non-empty)
 * for a valid loader config; `null` is also a legal value in the schema to
 * indicate that no loader config is provided.
 */
export interface ILoaderConfig {
  /**
   * Base URLs prepended to every 'internal' / 'localizedPath' resource path.
   * The loader tries each URL in order, falling back to the next on failure.
   * At least one URL is required for a valid loader configuration.
   * Optional here to accommodate minimally-typed manifests; the serve always
   * provides a value in practice.
   */
  internalModuleBaseUrls?: string[];

  /**
   * Key into `scriptResources` that identifies the component's entry-point module.
   * The loader downloads, evaluates, and returns this module's export.
   * Must reference a resource of type 'path' or 'localizedPath'.
   */
  entryModuleId?: string;

  /**
   * Top-level field name from the entry module's export to use as the resolved value.
   * When set, that field is returned instead of the module's default export.
   */
  exportName?: string;

  /**
   * Dictionary of named script resources (bundles, locale strings, framework modules).
   * The entry referenced by `entryModuleId` must be present here.
   */
  scriptResources?: Record<string, IScriptResource>;
}
