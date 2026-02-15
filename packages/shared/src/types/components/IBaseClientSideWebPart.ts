/**
 * Base interface for client-side web parts
 * Defines the lifecycle methods and properties expected by SPFx
 */
export interface IBaseClientSideWebPart {
  /** Render the web part to its DOM element */
  render: () => void;
  
  /** Optional cleanup when web part is removed */
  onDispose?: () => void;
  
  /** Optional initialization (can be async) */
  onInit?: () => Promise<void> | void;
  
  /** Optional theme change handler */
  onThemeChanged?: (theme: any) => void;
  
  /** Optional property pane field change handler */
  onPropertyPaneFieldChanged?: (propertyPath: string, oldValue: any, newValue: any) => void;
  
  /** Optional property pane configuration provider */
  getPropertyPaneConfiguration?: () => any;
}
