export interface IVsCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

export interface IWorkbenchConfig {
    serveUrl: string;
    webParts: IWebPartManifest[];
    extensions?: IWebPartManifest[];
    theme?: IThemeSettings;
    context?: IContextSettings;
    pageContext?: IPageContextSettings;
}

export interface ILocalizedString {
    default: string;
    [key: string]: string;
}

export interface IWebPartManifest {
    id: string;
    alias: string;
    componentType: string;
    version?: string;
    loaderConfig?: {
        entryModuleId?: string;
        internalModuleBaseUrls?: string[];
        scriptResources?: Record<string, any>;
    };
    preconfiguredEntries?: Array<{
        title: ILocalizedString;
        description: ILocalizedString;
        officeFabricIconFontName?: string;
        iconImageUrl?: string;
        groupId: string;
        group?: ILocalizedString;
        properties?: Record<string, any>;
    }>;
}

export interface IBaseClientSideWebPart {
    render: () => void;
    onDispose: () => void;
    onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void;
    getPropertyPaneConfiguration: () => IPropertyPaneConfiguration;
}

/** Web part configuration before instantiation (no runtime state). */
export interface IWebPartConfig {
    manifest: IWebPartManifest;
    instanceId: string;
    properties: Record<string, any>;
}

/** Fully instantiated web part with runtime context and instance. */
export interface IActiveWebPart extends IWebPartConfig {
    context: any;
    instance: IBaseClientSideWebPart;
}

export function isActiveWebPart(wp: IWebPartConfig): wp is IActiveWebPart {
    return 'instance' in wp && (wp as any).instance !== null;
}

/** Extension configuration before instantiation (no runtime state). */
export interface IExtensionConfig {
    manifest: IWebPartManifest;
    instanceId: string;
    properties: Record<string, any>;
}

/** Fully instantiated extension with runtime context, instance, and DOM elements. */
export interface IActiveExtension extends IExtensionConfig {
    context: any;
    instance: any;
    headerDomElement?: HTMLDivElement;
    footerDomElement?: HTMLDivElement;
}

export function isActiveExtension(ext: IExtensionConfig): ext is IActiveExtension {
    return 'instance' in ext && (ext as any).instance !== null;
}

export interface IThemeSettings {
    preset?: 'teamSite' | 'communicationSite' | 'dark' | 'highContrast' | 'custom';
    customColors?: Record<string, string>;
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
}

export interface IContextSettings {
    siteUrl: string;
    webUrl: string;
    userDisplayName: string;
    userEmail: string;
    userLoginName: string;
    culture: string;
    isAnonymousGuestUser: boolean;
    customContext: Record<string, unknown>;
}

export interface IPageContextSettings {
    webTitle: string;
    webDescription: string;
    webTemplate: string;
    isNoScriptEnabled: boolean;
    isSPO: boolean;
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
            getManifests(): IWebPartManifest[];
        };
    }
}