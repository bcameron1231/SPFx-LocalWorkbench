import type { ILoaderConfig } from './ILoaderConfig';

// ─── Base manifest interface ──────────────────────────────────────────────────

/**
 * Fields shared by ALL SPFx client-side component manifests.
 * Models the intersection of `clientSideManifestBase` and
 * `clientSideComponentManifest` from the official SPFx JSON schemas.
 *
 * Both `IWebPartManifest` and `IExtensionManifest` extend this interface.
 */
export interface IClientSideComponentManifest {
  // ── client-side-manifest-base ──────────────────────────────────────────────

  /** JSON schema reference */
  $schema?: string;

  /** Manifest schema version (always 2 for modern SPFx) */
  manifestVersion?: number;

  /** Unique component identifier (GUID) */
  id: string;

  // ── client-side-component-manifest ────────────────────────────────────────

  /**
   * A short, developer-given name that does not need to be localised and should
   * remain stable throughout the component lifetime.
   */
  alias: string;

  /**
   * The component type.  Narrowed to a specific literal in each sub-interface
   * (`'WebPart'` in `IWebPartManifest`, `'Extension'` in `IExtensionManifest`).
   */
  componentType: string;

  /** Semantic version string (semver) or '*'. */
  version?: string;

  /** Manifest-level property bag (not the same as preconfiguredEntries properties). */
  properties?: Record<string, unknown>;

  /** Bundle loader configuration. */
  loaderConfig?: ILoaderConfig;

  /**
   * GUIDs of other component manifests that must be preloaded alongside this one.
   * Each entry must be at least 10 characters.
   */
  preloadComponents?: string[];

  /**
   * Whether to use the legacy Fabric CSS load sequence.
   * Leave false for components built against SPFx 1.1+.
   */
  loadLegacyFabricCss?: boolean;

  /**
   * If true the component requires custom script to be enabled on the site.
   * Mutually exclusive with safeWithCustomScriptDisabled.
   */
  requiresCustomScript?: boolean;

  /**
   * If true the component is safe to use even when custom script is disabled.
   * Mutually exclusive with requiresCustomScript.
   */
  safeWithCustomScriptDisabled?: boolean;
}
