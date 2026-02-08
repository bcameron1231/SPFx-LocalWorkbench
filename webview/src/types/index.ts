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
        title?: { default?: string };
        description?: { default?: string };
        properties?: Record<string, any>;
    }>;
}

export interface IActiveWebPart {
    manifest: IWebPartManifest;
    instanceId: string;
    properties: Record<string, any>;
    context: any;
    instance: any;
}

export interface IActiveExtension {
    manifest: IWebPartManifest;
    instanceId: string;
    properties: Record<string, any>;
    context: any;
    instance: any;
    headerDomElement: HTMLDivElement | null;
    footerDomElement: HTMLDivElement | null;
}

export interface IThemeSettings {
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
