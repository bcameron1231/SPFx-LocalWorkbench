import type { IWebPartManifest } from '../manifests';

/**
 * Extension configuration before instantiation
 * Contains manifest and initial properties, but no runtime state
 */
export interface IExtensionConfig {
  /** Component manifest */
  manifest: IWebPartManifest;
  
  /** Unique instance identifier */
  instanceId: string;
  
  /** Extension properties */
  properties: Record<string, any>;
}
