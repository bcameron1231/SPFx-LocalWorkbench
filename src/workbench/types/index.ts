// Type definitions for SPFx Local Workbench
import type { ILocalizedString } from '@spfx-local-workbench/shared';

// Export locale-related types and utilities
export * from './LocaleTypes';

// Web part manifest structure
export interface IWebPartManifest {
  id: string;
  alias: string;
  componentType: 'WebPart';
  version: string;
  manifestVersion: number;
  preconfiguredEntries?: IPreconfiguredEntry[];
  loaderConfig?: ILoaderConfig;
}

// Extension manifest structure
export interface IExtensionManifest {
  id: string;
  alias: string;
  componentType: 'Extension';
  version: string;
  manifestVersion: number;
  extensionType: 'Unknown' | 'ApplicationCustomizer' | 'FieldCustomizer' | 'ListViewCommandSet' | 'SearchQueryModifier' | 'FormCustomizer';
  loaderConfig?: ILoaderConfig;
}

// Preconfigured entry for web part
export interface IPreconfiguredEntry {
  groupId: string;
  group: ILocalizedString;
  title: ILocalizedString;
  description: ILocalizedString;
  properties: Record<string, unknown>;
}

// Loader configuration for web part bundles
export interface ILoaderConfig {
  internalModuleBaseUrls: string[];
  entryModuleId: string;
  scriptResources: Record<string, IScriptResource>;
}

// Script resource definition
export interface IScriptResource {
  type: string;
  path?: string;
  paths?: Record<string, string>;
}

// SPFx project configuration (version 2.0)
export interface ISpfxConfig {
  $schema?: string;
  version: string;
  bundles: Record<string, IBundleConfig>;
  externals?: Record<string, string | IExternalConfig>;
  localizedResources?: Record<string, string>;
  asyncComponents?: string[];
}

// Bundle configuration
export interface IBundleConfig {
  components: IComponentEntry[];
}

// External bundle configuration (for non-AMD dependencies)
export interface IExternalConfig {
  path: string;
  globalName: string;
  globalDependencies?: string[];
}

// Component entry in bundle
export interface IComponentEntry {
  entrypoint: string;
  manifest: string;
}

// Workbench configuration
export interface IWorkbenchConfig {
  serveUrl: string;
  webParts: IWebPartManifest[];
  nonce: string;
  cspSource: string;
}

// Message from webview to extension
export interface IWebviewMessage {
  command: 'refresh' | 'setServeUrl' | 'openDevTools' | 'log' | 'error';
  url?: string;
  text?: string;
}
