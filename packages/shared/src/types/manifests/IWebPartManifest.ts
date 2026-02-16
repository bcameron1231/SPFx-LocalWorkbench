import type { ILoaderConfig } from './ILoaderConfig';
import type { IPreconfiguredEntry } from './IPreconfiguredEntry';

/**
 * SPFx component manifest
 * Represents both web parts and extensions
 */
export interface IWebPartManifest {
  /** Unique component identifier (GUID) */
  id: string;

  /** Component alias used for bundle naming */
  alias: string;

  /** Component type */
  componentType: 'WebPart' | 'Extension' | string;

  /** Semantic version */
  version?: string;

  /** Manifest schema version */
  manifestVersion?: number;

  /** Bundle loader configuration */
  loaderConfig?: ILoaderConfig;

  /** Preconfigured entries for property pane */
  preconfiguredEntries?: IPreconfiguredEntry[];
}
