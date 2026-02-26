/**
 * Type definitions for the SPFx Storybook addon
 */
import type { IPageContextConfig, ITheme, IThemePalette } from '@spfx-local-workbench/shared';

import { DisplayMode } from './constants';

/**
 * SPFx story parameters
 */
export interface ISpfxParameters {
  /**
   * Component ID from the SPFx web part manifest (`id` field).
   * Required for the addon to load the correct bundle from the local serve.
   */
  componentId: string;

  /**
   * Index of the preconfiguredEntry this story should use.
   * Used when a manifest has multiple preconfiguredEntries so each gets its own story.
   * Defaults to 0 when absent.
   */
  preconfiguredEntryIndex?: number;

  /**
   * Property values for the web part.
   * The manifest's `preconfiguredEntry.properties` are used as the base; any
   * properties defined here are merged on top, overriding the manifest values
   * for the keys that are specified.
   */
  properties?: Record<string, any>;

  /**
   * Initial display mode for the web part.
   * Defaults to `DisplayMode.Edit` (2).
   */
  displayMode?: DisplayMode;

  /**
   * The case-sensitive name of the theme to apply when this story is active.
   * When set, overrides the global toolbar selection for this story.
   * Stories without this property are theme-agnostic and inherit the current
   * global theme (set via the `spfxTheme` global, or last picked in the toolbar).
   * Must match an `ITheme.name` value from MICROSOFT_THEMES, a theme provided via the
   * `spfxCustomThemes` global, or this story's own `customThemes` list.
   */
  themeName?: string;

  /**
   * Additional themes to make available in the theme picker for this story only.
   * Displayed under "This story" at the top of the theme toolbar dropdown.
   * A story theme with the same `name` as a predefined theme will take
   * precedence over it in the picker.
   */
  customThemes?: ITheme[];

  /**
   * The BCP-47 locale code to use for this story (e.g. `'en-US'`, `'fr-FR'`).
   * Controls string loading from the SPFx locale files.
   */
  locale?: string;

  /**
   * The URL where the SPFx `heft start` is running.
   * Defaults to `https://localhost:4321`.
   */
  serveUrl?: string;

  /**
   * Whether to show the property pane panel by default when the story loads.
   * Defaults to `false`.
   */
  showPropertyPane?: boolean;

  /**
   * SharePoint context configuration to merge with defaults.
   * Use this to customise `pageContext` fields (web title, site URL, user info, etc.)
   * without having to specify the full context object.
   */
  context?: ISpfxContextConfig;

}

/**
 * SharePoint context configuration
 * Uses Partial to make all properties optional for flexible merging with defaults
 */
export type ISpfxContextConfig = {
  pageContext?: Partial<IPageContextConfig>;
};

/**
 * SharePoint page context configuration (deprecated - use ISpfxContextConfig)
 * @deprecated Use context property which mirrors actual SPFx structure
 */
export interface ISpfxPageContextConfig {
  webTitle?: string;
  webDescription?: string;
  webTemplate?: string;
  isNoScriptEnabled?: boolean;
  isSPO?: boolean;
}

// Re-export theme types from shared package for convenience
export type { ITheme, IThemePalette };

/**
 * SPFx component manifest (simplified)
 */
export interface ISpfxManifest {
  id: string;
  alias: string;
  componentType: 'WebPart' | 'Extension';
  version: string;
  manifestVersion: number;
  loaderConfig?: {
    entryModuleId?: string;
    internalModuleBaseUrls?: string[];
    scriptResources?: Record<string, any>;
  };
  preconfiguredEntries?: Array<{
    title: { default: string };
    description: { default: string };
    properties?: Record<string, any>;
  }>;
}
