import type { IBaseApplicationCustomizer } from './IBaseApplicationCustomizer';
import type { IExtensionConfig } from './IExtensionConfig';

/**
 * Active extension with runtime state
 * Extends IExtensionConfig with context and DOM elements after loading
 */
export interface IActiveExtension extends IExtensionConfig {
  /** SPFx runtime context */
  context: any;

  /** Extension instance */
  instance: IBaseApplicationCustomizer;

  /** Optional header placeholder element */
  headerDomElement?: HTMLDivElement;

  /** Optional footer placeholder element */
  footerDomElement?: HTMLDivElement;
}

/**
 * Type guard to check if an extension config is active
 */
export function isActiveExtension(ext: IExtensionConfig): ext is IActiveExtension {
  return 'instance' in ext && (ext as any).instance !== null;
}
