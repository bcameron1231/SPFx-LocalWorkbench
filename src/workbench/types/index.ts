// Type definitions for SPFx Local Workbench

// Web part manifest structure
export interface IWebPartManifest {
    id: string;
    alias: string;
    componentType: string;
    version: string;
    manifestVersion: number;
    preconfiguredEntries?: IPreconfiguredEntry[];
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

// Localized string with default and locale-specific values
export interface ILocalizedString {
    default: string;
    [locale: string]: string;
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
