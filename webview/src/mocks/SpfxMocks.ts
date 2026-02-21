import { spPropertyPaneModule } from './PropertyPaneMocks';
import { ProxyHttpClient } from '../proxy/ProxyHttpClient';
import { ProxySPHttpClient } from '../proxy/ProxySPHttpClient';
import { PassthroughHttpClient } from '../proxy/PassthroughHttpClient';
import { installFetchProxy, uninstallFetchProxy } from '../proxy/ProxyFetchClient';

// Deep recursive merge matching lodash merge behaviour
function deepMerge(target: any, ...sources: any[]): any {
    for (const source of sources) {
        if (source == null) { continue; }
        for (const key of Object.keys(source)) {
            const srcVal = source[key];
            const tgtVal = target[key];
            if (
                srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal) &&
                tgtVal && typeof tgtVal === 'object' && !Array.isArray(tgtVal)
            ) {
                target[key] = deepMerge({ ...tgtVal }, srcVal);
            } else {
                target[key] = srcVal;
            }
        }
    }
    return target;
}

export function initializeSpfxMocks(proxyEnabled: boolean = true): void {
    const amdModules = window.__amdModules!;

    // Mock BaseClientSideWebPart - ES5-compatible constructor function
    // This is necessary because SPFx bundles compile to ES5 and use old-style
    // prototype inheritance. ES6 classes cannot be properly extended by ES5 code.
    function MockBaseClientSideWebPart(this: any) {
        this._properties = {};
        this._context = null;
        this._domElement = null;
    }
    
    MockBaseClientSideWebPart.prototype = {
        constructor: MockBaseClientSideWebPart,
        get context() { return this._context; },
        get domElement() { return this._domElement; },
        get properties() { return this._properties; },
        set properties(val) { this._properties = val; },
        onInit: function() { return Promise.resolve(); },
        render: function() {},
        getPropertyPaneConfiguration: function() { return { pages: [] }; },
        onPropertyPaneFieldChanged: function() {},
        onDispose: function() {}
    };
    
    // Ensure the prototype chain is correct for ES5 inheritance patterns
    Object.defineProperty(MockBaseClientSideWebPart.prototype, 'context', {
        get: function() { return this._context; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MockBaseClientSideWebPart.prototype, 'domElement', {
        get: function() { return this._domElement; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MockBaseClientSideWebPart.prototype, 'properties', {
        get: function() { return this._properties; },
        set: function(val) { this._properties = val; },
        enumerable: true,
        configurable: true
    });

    // Mock BaseApplicationCustomizer - ES5-compatible constructor function
    // Application Customizers use placeholders for header/footer rendering
    function MockBaseApplicationCustomizer(this: any) {
        this._properties = {};
        this._context = null;
    }

    MockBaseApplicationCustomizer.prototype = {
        constructor: MockBaseApplicationCustomizer,
        get context() { return this._context; },
        get properties() { return this._properties; },
        set properties(val) { this._properties = val; },
        onInit: function() { return Promise.resolve(); },
        onDispose: function() {}
    };

    Object.defineProperty(MockBaseApplicationCustomizer.prototype, 'context', {
        get: function() { return this._context; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MockBaseApplicationCustomizer.prototype, 'properties', {
        get: function() { return this._properties; },
        set: function(val) { this._properties = val; },
        enumerable: true,
        configurable: true
    });
    
    // Pre-register modules for SPFx dependencies
    // React and ReactDOM come from local vendor UMD bundles (window globals)
    amdModules['react'] = window.React;
    amdModules['React'] = window.React;
    amdModules['react-dom'] = window.ReactDOM;
    amdModules['ReactDOM'] = window.ReactDOM;
    
    amdModules['@microsoft/sp-webpart-base'] = {
        BaseClientSideWebPart: MockBaseClientSideWebPart
    };

    // Mock PlaceholderContent for Application Customizers
    // This simulates the SharePoint placeholder system (Top, Bottom)
    const PlaceholderName = {
        Top: 0,
        Bottom: 1
    };

    amdModules['@microsoft/sp-application-base'] = {
        BaseApplicationCustomizer: MockBaseApplicationCustomizer,
        PlaceholderName: PlaceholderName
    };

    // Also make it globally available for direct imports
    (window as any)['@microsoft/sp-application-base'] = amdModules['@microsoft/sp-application-base'];
    
    amdModules['@microsoft/sp-core-library'] = {
        Version: { parse: (_v: string) => ({ major: 1, minor: 0, patch: 0 }) },
        Environment: { type: 3 }, // Local
        EnvironmentType: { Local: 3, SharePoint: 1, ClassicSharePoint: 2 },
        Log: { 
            verbose: () => {}, 
            info: () => {}, 
            warn: console.warn, 
            error: console.error 
        },
        Guid: { 
            newGuid: () => ({ 
                toString: () => 'guid-' + Math.random().toString(36).substr(2, 9) 
            }) 
        },
        DisplayMode: { Read: 1, Edit: 2 }
    };
    
    // Register property pane module with proper field types
    amdModules['@microsoft/sp-property-pane'] = spPropertyPaneModule;
    
    // Also make it globally available for direct imports
    (window as any)['@microsoft/sp-property-pane'] = spPropertyPaneModule;
    
    // HTTP clients: when proxy is enabled, route through the extension host
    // via postMessage bridge for configurable mock responses. When disabled,
    // use passthrough clients that make real fetch() calls so external tools
    // like Dev Proxy can intercept them.
    const HttpClientImpl = proxyEnabled ? ProxyHttpClient : PassthroughHttpClient;
    const SPHttpClientImpl = proxyEnabled ? ProxySPHttpClient : PassthroughHttpClient;
    
    // Fetch proxy: when enabled, override window.fetch so libraries like
    // PnPJS that use fetch() directly also get routed through the proxy bridge.
    if (proxyEnabled) {
        installFetchProxy();
    } else {
        uninstallFetchProxy();
    }
    amdModules['@microsoft/sp-http'] = {
        HttpClient: HttpClientImpl,
        SPHttpClient: SPHttpClientImpl,
        SPHttpClientConfiguration: {},
        HttpClientConfiguration: {}
    };

    amdModules['@microsoft/sp-lodash-subset'] = {
        escape: (s: string) => s,
        cloneDeep: (o: any) => JSON.parse(JSON.stringify(o)),
        isEqual: (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b),
        merge: deepMerge,
        find: (arr: any[], pred: any) => arr.find(pred),
        findIndex: (arr: any[], pred: any) => arr.findIndex(pred)
    };

    // Register external dependencies resolved from the SPFx project's node_modules. These are libraries (like @fluentui/react) that SPFx marks as externals —
    const externals = window.__workbenchConfig?.externalDependencies ?? [];
    for (const dep of externals) {
        const globalValue = (window as any)[dep.globalName];
        if (globalValue) {
            amdModules[dep.moduleName] = globalValue;
            console.log(`SpfxMocks - Registered external "${dep.moduleName}" from SPFx project`);

            // Also register common aliases
            if (dep.moduleName === '@fluentui/react') {
                amdModules['office-ui-fabric-react'] = globalValue;
            }
        } else {
            console.warn(`SpfxMocks - External "${dep.moduleName}" expected at window.${dep.globalName} but not found`);
        }
    }

    // Mock @microsoft/sp-dialog - used by Application Customizers
    const MockDialog = {
        alert: (message: string) => {
            console.log('SPFx Dialog.alert:', message);
            return Promise.resolve();
        },
        prompt: (message: string, _options?: any) => {
            console.log('SPFx Dialog.prompt:', message);
            return Promise.resolve(undefined);
        }
    };

    amdModules['@microsoft/sp-dialog'] = {
        Dialog: MockDialog
    };

    (window as any)['@microsoft/sp-dialog'] = amdModules['@microsoft/sp-dialog'];
}
