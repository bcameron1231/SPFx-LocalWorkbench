// Extension Manager
// 
// Handles loading, instantiation, and lifecycle of SPFx Application Customizers.
// Application Customizers render content into header (Top) and footer (Bottom) 
// placeholders on the page.

import type { IWebPartManifest, IExtensionConfig, IActiveExtension, IVsCodeApi } from './types';
import { SpfxContext } from './mocks/SpfxContext';
import { ThemeProvider } from './mocks/ThemeProvider';

// PlaceholderName enum matching @microsoft/sp-application-base
enum PlaceholderName {
    Top = 0,
    Bottom = 1
};

// Mock PlaceholderContent that wraps an actual DOM element
class MockPlaceholderContent {
    private _disposed = false;

    constructor(public name: PlaceholderName, public domElement: HTMLDivElement) {}

    public dispose(): void {
        this._disposed = true;
        if (this.domElement) {
            this.domElement.innerHTML = '';
        }
    }

    public get isDisposed(): boolean {
        return this._disposed;
    }
}

export class ExtensionManager {
    private serveUrl: string;
    private contextProvider: SpfxContext;
    private themeProvider: ThemeProvider;

    constructor(
        _vscode: IVsCodeApi,
        serveUrl: string,
        contextProvider: SpfxContext,
        themeProvider: ThemeProvider
    ) {
        this.serveUrl = serveUrl;
        this.contextProvider = contextProvider;
        this.themeProvider = themeProvider;
    }

    async loadExtensionBundle(manifest: IWebPartManifest): Promise<void> {
        let bundlePath = '';

        if (manifest.loaderConfig?.scriptResources) {
            const entryId = manifest.loaderConfig.entryModuleId;
            const entry = entryId ? manifest.loaderConfig.scriptResources[entryId] : null;
            if (entry?.paths?.default) {
                bundlePath = entry.paths.default;
            } else if (entry?.path) {
                bundlePath = entry.path;
            }
        }

        if (!bundlePath) {
            bundlePath = 'dist/' + manifest.alias.toLowerCase() + '.js';
        }

        // Use internalModuleBaseUrls as the base (preserves /dist/ path)
        const baseUrl = manifest.loaderConfig?.internalModuleBaseUrls?.[0] || (this.serveUrl + '/');
        const fullUrl = baseUrl + bundlePath;

        // Cache-bust so live reload always fetches the freshly compiled bundle
        const cacheBustedUrl = fullUrl + (fullUrl.includes('?') ? '&' : '?') + '_v=' + Date.now();

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = cacheBustedUrl;
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                console.error('ExtensionManager - Failed to load bundle:', fullUrl);
                reject(new Error('Failed to load ' + fullUrl));
            };
            document.head.appendChild(script);
        });
    }

    async instantiateExtension(
        config: IExtensionConfig,
        headerElement: HTMLDivElement,
        footerElement: HTMLDivElement
    ): Promise<IActiveExtension | undefined> {
        try {
            await this.loadExtensionBundle(config.manifest);
            await new Promise(r => setTimeout(r, 100));

            const context = this.createExtensionContext(
                config.manifest.id,
                config.instanceId,
                headerElement,
                footerElement
            );

            const ExtensionClass = this.findExtensionClass(config.manifest);

            if (ExtensionClass && typeof ExtensionClass === 'function') {
                return await this.renderExtensionFromClass(ExtensionClass, config, context, headerElement, footerElement);
            }

            // Show debug info if couldn't find the class
            this.showDebugInfo(headerElement, config.manifest);
            return;

        } catch (error: any) {
            headerElement.innerHTML = '<div class="error-message">Failed to load extension: ' + error.message + '</div>';
            return;
        }
    }

    private createExtensionContext(
        extensionId: string,
        instanceId: string,
        headerElement: HTMLDivElement,
        footerElement: HTMLDivElement
    ): any {
        const baseContext = this.contextProvider.createMockContext(extensionId, instanceId);

        // Create mock placeholders for header and footer
        const topPlaceholder = new MockPlaceholderContent(PlaceholderName.Top, headerElement);
        const bottomPlaceholder = new MockPlaceholderContent(PlaceholderName.Bottom, footerElement);

        // Mock changedEvent - Application Customizers subscribe to this 
        // to know when placeholders become available
        const changedEventHandlers: Array<{ thisArg: any; handler: Function }> = [];
        const changedEvent = {
            add: (thisArg: any, handler: Function) => {
                changedEventHandlers.push({ thisArg, handler });
            },
            remove: (_thisArg: any, _handler: Function) => {
                // no-op for mock
            }
        };

        // Mock placeholderProvider - this is what Application Customizers use
        // to access the Top and Bottom placeholders
        const placeholderProvider = {
            placeholderNames: [PlaceholderName[PlaceholderName.Top], PlaceholderName[PlaceholderName.Bottom]],
            changedEvent: changedEvent,
            tryCreateContent: (name: PlaceholderName, _options?: any) => {
                if (name === PlaceholderName.Top) {
                    return topPlaceholder;
                } else if (name === PlaceholderName.Bottom) {
                    return bottomPlaceholder;
                }
                return null;
            }
        };

        // Fire changedEvent after a short delay so handlers registered in onInit get called
        setTimeout(() => {
            changedEventHandlers.forEach(({ thisArg, handler }) => {
                try {
                    handler.call(thisArg);
                } catch (e: any) {
                    console.error('ExtensionManager - Error in changedEvent handler:', e);
                }
            });
        }, 50);

        return {
            ...baseContext,
            placeholderProvider: placeholderProvider
        };
    }

    private findExtensionClass(manifest: IWebPartManifest): any {
        const amdModules = window.__amdModules!;
        const alias = manifest.alias;
        const manifestId = manifest.id;
        const version = manifest.version || '0.0.1';
        const entryModuleId = manifest.loaderConfig?.entryModuleId || alias;

        let extensionClass = null;
        let foundModule = null;

        // Try various patterns to find the module
        const idWithVersion = manifestId + '_' + version;
        const searchPatterns = [
            idWithVersion,
            manifestId,
            entryModuleId,
            alias
        ];

        for (const pattern of searchPatterns) {
            if (amdModules[pattern]) {
                foundModule = amdModules[pattern];
                break;
            }
        }

        // Pattern match as fallback
        if (!foundModule) {
            for (const [name, mod] of Object.entries(amdModules)) {
                if (name.includes(manifestId) || name.toLowerCase().includes(alias.toLowerCase())) {
                    foundModule = mod;
                    break;
                }
            }
        }

        // Extract the extension class from the module
        if (foundModule) {
            extensionClass = this.extractExtensionClass(foundModule, alias);
        }

        // Last resort: search all modules (including anonymous) for a class
        // with onInit but NOT render (to distinguish from web parts).
        // SPFx extension bundles use anonymous AMD define() calls, so the
        // module gets registered with an _anonymous_ key.
        if (!extensionClass) {
            // Known mock/infrastructure module keys to skip
            const skipModules = new Set([
                'react', 'React', 'react-dom', 'ReactDOM',
                '@microsoft/sp-webpart-base', '@microsoft/sp-application-base',
                '@microsoft/sp-core-library', '@microsoft/sp-property-pane',
                '@microsoft/sp-http', '@microsoft/sp-lodash-subset',
                '@microsoft/sp-dialog', '@fluentui/react', 'office-ui-fabric-react'
            ]);

            for (const [name, mod] of Object.entries(amdModules)) {
                if (skipModules.has(name)) continue;
                if (!mod) continue;

                const candidate = this.extractExtensionClass(mod, alias);
                if (candidate) {
                    // Verify it looks like a customizer (has onInit) and 
                    // not a web part (has render)
                    const proto = candidate.prototype;
                    if (proto && typeof proto.onInit === 'function' && typeof proto.render !== 'function') {
                        extensionClass = candidate;
                        break;
                    }
                }
            }
        }

        return extensionClass;
    }

    // Extracts an extension class from a module export
    private extractExtensionClass(mod: any, alias: string): any {
        if (!mod) return null;

        if (typeof mod === 'function' && mod.prototype?.onInit) {
            return mod;
        }
        if (mod.default && typeof mod.default === 'function') {
            return mod.default;
        }
        if (mod[alias + 'ApplicationCustomizer'] && typeof mod[alias + 'ApplicationCustomizer'] === 'function') {
            return mod[alias + 'ApplicationCustomizer'];
        }

        // Search for a class with onInit method
        for (const [key, value] of Object.entries(mod)) {
            if (typeof value === 'function' && (value as any).prototype) {
                if (typeof (value as any).prototype.onInit === 'function' &&
                    (key.toLowerCase().includes('customizer') ||
                     key.toLowerCase().includes('extension') ||
                     key.toLowerCase().includes('application') ||
                     key === 'default')) {
                    return value;
                }
            }
        }

        // Any class with onInit (but not render) as last resort within this module
        for (const [_key, value] of Object.entries(mod)) {
            if (typeof value === 'function' && (value as any).prototype) {
                if (typeof (value as any).prototype.onInit === 'function' &&
                    typeof (value as any).prototype.render !== 'function') {
                    return value;
                }
            }
        }

        return null;
    }

    private async renderExtensionFromClass(
        ExtensionClass: any,
        config: IExtensionConfig,
        context: any,
        headerElement: HTMLDivElement,
        footerElement: HTMLDivElement
    ): Promise<IActiveExtension> {
        try {
            const instance = new ExtensionClass();
            const active: IActiveExtension = {
                ...config,
                context,
                instance,
                headerDomElement: headerElement,
                footerDomElement: footerElement
            };

            // Set up the instance with our mock context
            instance._context = active.context;
            this.setupProperty(instance, 'context', () => active.context);

            instance._properties = active.properties;
            this.setupProperty(
                instance,
                'properties',
                () => active.properties,
                (val: any) => {
                    active.properties = val;
                    instance._properties = val;
                }
            );

            // Call onInit - Application Customizers do their work in onInit
            // They use this.context.placeholderProvider.tryCreateContent() to get
            // DOM elements for header/footer rendering
            if (typeof instance.onInit === 'function') {
                try {
                    const initResult = instance.onInit();
                    if (initResult && typeof initResult.then === 'function') {
                        await initResult;
                    }
                } catch (e: any) {
                    console.error('ExtensionManager - Error in onInit:', e);
                }
            }

            // Apply theme
            this.themeProvider.applyThemeToWebPart(headerElement);
            this.themeProvider.applyThemeToWebPart(footerElement);

            // Check if content was rendered
            setTimeout(() => {
                const hasHeaderContent = headerElement.innerHTML.trim().length > 0;
                const hasFooterContent = footerElement.innerHTML.trim().length > 0;
                
                if (!hasHeaderContent && !hasFooterContent) {
                    // Extension rendered but no placeholder content was created.
                    // This is normal if the extension uses conditional rendering.
                }
            }, 500);

            return active;
        } catch (e: any) {
            console.error('ExtensionManager - Setup error:', e);
            headerElement.innerHTML = '<div class="error-message">Extension setup error: ' + e.message + '</div>';
            throw e;
        }
    }

    private setupProperty(
        instance: any,
        propName: string,
        getter: () => any,
        setter?: (val: any) => void
    ): void {
        try {
            const descriptor: PropertyDescriptor = {
                get: getter,
                configurable: true,
                enumerable: true
            };
            if (setter) {
                descriptor.set = setter;
            }
            Object.defineProperty(instance, propName, descriptor);
        } catch (e: any) {
            // Silently fail - some properties might be non-configurable
        }
    }

    private showDebugInfo(domElement: HTMLElement, manifest: IWebPartManifest): void {
        const amdModules = window.__amdModules!;
        let debugHtml = '<div style="padding:12px;color:#605e5c;font-size:13px;">';
        debugHtml += '<p><strong>' + manifest.alias + '</strong> extension bundle loaded.</p>';
        debugHtml += '<p style="color:#a80000;">Could not find Application Customizer class.</p>';
        debugHtml += '<p><strong>Manifest ID:</strong> ' + manifest.id + '</p>';
        debugHtml += '<p><strong>Available modules:</strong></p>';
        debugHtml += '<ul style="font-size:11px;max-height:150px;overflow:auto;">';
        for (const [name, mod] of Object.entries(amdModules)) {
            const modType = typeof mod;
            const modKeys = mod ? Object.keys(mod).slice(0, 5).join(', ') : 'null';
            debugHtml += '<li><strong>' + name + '</strong>: ' + modType + ' [' + modKeys + ']</li>';
        }
        debugHtml += '</ul>';
        debugHtml += '</div>';
        domElement.innerHTML = debugHtml;
    }
}
