import type { IWebPartManifest } from '../manifests';

/**
 * Web part configuration before instantiation
 * Contains manifest and initial properties, but no runtime state
 */
export interface IWebPartConfig {
  /** Component manifest */
  manifest: IWebPartManifest;

  /** Unique instance identifier */
  instanceId: string;

  /** Component properties */
  properties: Record<string, any>;
}
