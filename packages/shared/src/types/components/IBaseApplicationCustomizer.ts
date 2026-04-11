/**
 * Base interface for application customizers
 * Extensions run at page level and can render to placeholder elements
 */
export interface IBaseApplicationCustomizer {
  /** Optional initialization (can be async) */
  onInit?: () => Promise<void> | void;

  /** Optional cleanup when extension is removed */
  onDispose?: () => void;

  /** Optional render method for extensions that output UI */
  onRender?: () => void;
}
