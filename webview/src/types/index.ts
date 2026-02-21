import type { IPageContextConfig, IWebPartManifest, IExtensionManifest, IComponentManifest } from '@spfx-local-workbench/shared';

// ─── Webview-specific types ───────────────────────────────────────────────────

export interface IVsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

export interface IWorkbenchConfig {
  serveUrl: string;
  webParts: IWebPartManifest[];
  extensions?: IExtensionManifest[];
  theme?: IThemeSettings;
  context: IContextSettings; // Always provided by extension (from WorkbenchConfig defaults)
}

export interface IThemeSettings {
  preset?: 'teamSite' | 'communicationSite' | 'dark' | 'highContrast' | 'custom';
  customColors?: Record<string, string>;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface IContextSettings {
  pageContext: IPageContextConfig;
}

export interface IPropertyPaneConfiguration {
  currentPage?: number;
  showLoadingIndicator?: boolean;
  loadingIndicatorDelayTime?: number;
  pages: IPropertyPanePage[];
}

export interface IPropertyPanePage {
  header?: { description: string };
  groups: IPropertyPaneGroup[];
}

export interface IPropertyPaneGroup {
  groupName?: string;
  groupFields: IPropertyPaneField[];
}

export interface IPropertyPaneField {
  type: number;
  targetProperty: string;
  properties: any;
}

declare global {
  interface Window {
    __workbench?: any;
    __workbenchConfig?: IWorkbenchConfig;
    __amdModules?: Record<string, any>;
    __amdPending?: Record<string, Array<(module: any) => void>>;
    acquireVsCodeApi(): IVsCodeApi;
    React?: any;
    ReactDOM?: any;
    define?: any;
    require?: any;
    requirejs?: any;
    debugManifests?: {
      getManifests(): IComponentManifest[];
    };
  }
}
