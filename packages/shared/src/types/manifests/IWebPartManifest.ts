import type { IClientSideComponentManifest } from './IClientSideComponentManifest';
import type { IFlexibleLayoutSizing } from './IFlexibleLayoutSizing';
import type { IPreconfiguredEntry } from './IPreconfiguredEntry';
import type { IPropertiesMetadata } from './IPropertiesMetadata';
import type { IRequiredCapabilities } from './IRequiredCapabilities';

// ─── Web part manifest interface ─────────────────────────────────────────────

/**
 * SPFx client-side web part manifest.
 * Extends `IClientSideComponentManifest` with web-part-specific fields and
 * narrows `componentType` to `'WebPart'`.
 * Models `client-side-web-part-manifest.schema.json`.
 */
export interface IWebPartManifest extends IClientSideComponentManifest {
  /** Always `'WebPart'` for web part manifests. */
  componentType: 'WebPart';

  // ── web-part-specific fields ───────────────────────────────────────────────

  /**
   * Pre-configured toolbox entries. At least one entry is required for web parts.
   * Each entry defines a distinct toolbox listing with its own title, icon, and
   * default property values.
   */
  preconfiguredEntries?: IPreconfiguredEntry[];

  /** Names of web part properties to index for SharePoint search. */
  searchablePropertyNames?: string[];

  /** @deprecated Use propertiesMetadata instead. */
  linkPropertyNames?: string[];

  /** @deprecated Use propertiesMetadata instead. */
  imageLinkPropertyNames?: string[];

  /**
   * Capabilities the host must provide for the web part to be usable.
   * If a required capability is absent the web part will not appear in the toolbox.
   */
  requiredCapabilities?: IRequiredCapabilities;

  /**
   * If true, the property pane is used to configure this web part.
   * @default true
   */
  canUpdateConfiguration?: boolean;

  /** If true, the web part is disabled on classic SharePoint pages. */
  disabledOnClassicSharepoint?: boolean;

  /** Property bag for properties not yet ready for production. */
  experimentalData?: Record<string, unknown>;

  /** If true, the web part will not appear in the modern SharePoint toolbox. */
  hiddenFromToolbox?: boolean;

  /** If true, the web part supports and has been tested for full-bleed layouts. */
  supportsFullBleed?: boolean;

  /**
   * DOM isolation level for the web part.
   * - 'None': No isolation (default).
   * - 'DOMIsolation': Shadow DOM isolation.
   * - 'DomainIsolation': Cross-origin iframe isolation.
   */
  isolationLevel?: 'None' | 'DOMIsolation' | 'DomainIsolation';

  /** If true, the web part supports theme variants. */
  supportsThemeVariants?: boolean;

  /**
   * Controls behaviour when web part data is updated by an external source.
   * true  = dispose and reload the web part.
   * false = deserialise properties in-place and call onAfterPropertiesUpdatedExternally.
   */
  useFallbackWhenPropertiesUpdatedExternally?: boolean;

  /**
   * Host surfaces on which the web part can be placed.
   * Defaults to ['SharePointFullPage'] when omitted.
   */
  supportedHosts?: (
    | 'SharePointFullPage'
    | 'SharePointWebPart'
    | 'TeamsTab'
    | 'TeamsPersonalApp'
    | 'TeamsMeetingApp'
  )[];

  /**
   * If true, the web part (when running as a Teams app) may iframe pages from
   * the same SharePoint tenant.
   */
  supportsSelfFramingInTeams?: boolean;

  /** Flexible layout sizing metadata for modern page flexible canvas (SPFx 1.18+). */
  flexibleLayoutSizing?: IFlexibleLayoutSizing;

  /** Metadata describing searchability and link-crawlability of web part properties (SPFx 1.12+). */
  propertiesMetadata?: IPropertiesMetadata;
}
