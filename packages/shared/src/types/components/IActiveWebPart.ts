import type { IBaseClientSideWebPart } from './IBaseClientSideWebPart';
import type { IWebPartConfig } from './IWebPartConfig';

/**
 * Active web part with runtime state
 * Extends IWebPartConfig with context and instance after component is loaded
 */
export interface IActiveWebPart extends IWebPartConfig {
  /** SPFx runtime context (pageContext, etc.) */
  context: any;
  
  /** Component instance */
  instance: IBaseClientSideWebPart;
}

/**
 * Type guard to check if a web part config is active
 */
export function isActiveWebPart(wp: IWebPartConfig): wp is IActiveWebPart {
  return 'instance' in wp && (wp as any).instance !== null;
}
