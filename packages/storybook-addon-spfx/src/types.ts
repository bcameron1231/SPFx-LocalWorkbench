/**
 * Type definitions for the SPFx Storybook addon
 */
import type { IPageContextConfig, ITheme, IThemePalette } from '@spfx-local-workbench/shared';

import { DisplayMode } from './constants';

/**
 * SPFx story parameters
 */
export interface ISpfxParameters {
  /** Component ID from manifest */
  componentId: string;

  /**
   * Index of the preconfiguredEntry this story was generated from.
   * Used when a manifest has multiple preconfiguredEntries so each gets its own story.
   * Defaults to 0 when absent.
   */
  preconfiguredEntryIndex?: number;

  /** Initial property values */
  properties?: Record<string, any>;

  /** Initial display mode */
  displayMode?: DisplayMode;

  /** Initial theme ID */
  themeId?: string;

  /** Initial locale */
  locale?: string;

  /** Serve URL for loading bundles */
  serveUrl?: string;

  /** Whether to show property pane by default */
  showPropertyPane?: boolean;

  /** SharePoint context configuration */
  context?: ISpfxContextConfig;

  /** SharePoint page context configuration */
  pageContext?: ISpfxPageContextConfig;
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
