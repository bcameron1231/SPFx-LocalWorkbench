// Web Part Manager
// 
// Handles loading, instantiation, and lifecycle of SPFx web parts

import type { IWebPartManifest, IActiveWebPart, IVsCodeApi } from './types';
import { SpfxContext } from './mocks/SpfxContext';
import { ThemeProvider } from './mocks/ThemeProvider';

export class WebPartManager {
    private vscode: IVsCodeApi;
    private serveUrl: string;
    private contextProvider: SpfxContext;
    private themeProvider: ThemeProvider;

    constructor(
        vscode: IVsCodeApi,
        serveUrl: string,
        contextProvider: SpfxContext,
        themeProvider: ThemeProvider
    ) {
        this.vscode = vscode;
        this.serveUrl = serveUrl;
        this.contextProvider = contextProvider;
        this.themeProvider = themeProvider;
    }

    async loadWebPartBundle(manifest: IWebPartManifest): Promise<void> {
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
                reject(new Error('Failed to load ' + fullUrl));
            };
            document.head.appendChild(script);
        });
    }

    async instantiateWebPart(webPart: IActiveWebPart, domElement: HTMLElement): Promise<void> {
        if (!domElement) {
            return;
        }

        try {
            await this.loadWebPartBundle(webPart.manifest);
            await new Promise(r => setTimeout(r, 100));

            const context = this.contextProvider.createMockContext(
                webPart.manifest.id,
                webPart.instanceId
            );
            context.domElement = domElement;
            webPart.context = context;

            const WebPartClass = this.findWebPartClass(webPart.manifest);

            if (WebPartClass && typeof WebPartClass === 'function') {
                await this.renderWebPartFromClass(WebPartClass, webPart, domElement);
                return;
            }

            // Show debug info if we couldn't find the class
            this.showDebugInfo(domElement, webPart.manifest, webPart.properties);

        } catch (error: any) {
            domElement.innerHTML = '<div class="error-message">Failed to load: ' + error.message + '</div>';
        }
    }

    private findWebPartClass(manifest: IWebPartManifest): any {
        const amdModules = window.__amdModules!;
        const alias = manifest.alias;
        const manifestId = manifest.id;
        const version = manifest.version || '0.0.1';
        const entryModuleId = manifest.loaderConfig?.entryModuleId || alias;

        let webPartClass = null;
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

        // Extract the web part class from the module
        if (foundModule) {
            if (typeof foundModule === 'function') {
                webPartClass = foundModule;
            } else if (foundModule.default && typeof foundModule.default === 'function') {
                webPartClass = foundModule.default;
            } else if (foundModule[alias + 'WebPart'] && typeof foundModule[alias + 'WebPart'] === 'function') {
                webPartClass = foundModule[alias + 'WebPart'];
            } else {
                // Search for a class with render method
                for (const [key, value] of Object.entries(foundModule)) {
                    if (typeof value === 'function' && (value as any).prototype) {
                        if (typeof (value as any).prototype.render === 'function' ||
                            key.toLowerCase().includes('webpart')) {
                            webPartClass = value;
                            break;
                        }
                    }
                }
            }
        }

        // Last resort: search all modules for render() method
        if (!webPartClass) {
            for (const [name, mod] of Object.entries(amdModules)) {
                if (name.startsWith('_anonymous_')) continue;

                const candidates = [mod, mod?.default];
                for (const candidate of candidates) {
                    if (candidate && typeof candidate === 'function' && candidate.prototype) {
                        if (typeof candidate.prototype.render === 'function') {
                            webPartClass = candidate;
                            break;
                        }
                    }
                }
                if (webPartClass) break;
            }
        }

        return webPartClass;
    }

    private async renderWebPartFromClass(
        WebPartClass: any,
        webPart: IActiveWebPart,
        domElement: HTMLElement
    ): Promise<void> {
        try {
            const instance = new WebPartClass();
            webPart.instance = instance;

            // Set up the instance with our mock context
            instance._context = webPart.context;
            this.setupProperty(instance, 'context', () => webPart.context);

            instance._domElement = domElement;
            this.setupProperty(instance, 'domElement', () => domElement);

            instance._properties = webPart.properties;
            this.setupProperty(
                instance,
                'properties',
                () => webPart.properties,
                (val: any) => {
                    webPart.properties = val;
                    instance._properties = val;
                }
            );

            instance._displayMode = 2; // Edit mode
            this.setupProperty(instance, 'displayMode', () => 2);

            // Call onInit if available
            if (typeof instance.onInit === 'function') {
                try {
                    const initResult = instance.onInit();
                    if (initResult && typeof initResult.then === 'function') {
                        await initResult;
                    } else {
                    }
                } catch (e: any) {
                }
            }

            // Apply theme
            this.themeProvider.applyThemeToWebPart(domElement);

            // Call onThemeChanged if available
            if (typeof instance.onThemeChanged === 'function') {
                try {
                    instance.onThemeChanged(this.themeProvider.getTheme());
                } catch (e: any) {
                }
            }

            // Render
            if (typeof instance.render === 'function') {
                try {
                    instance.render();

                    if (domElement.innerHTML.length === 0) {
                        setTimeout(() => {
                            if (domElement.innerHTML.length === 0) {
                                domElement.innerHTML = '<div style="padding:20px;color:#605e5c;text-align:center;"><p>Web part rendered but produced no visible content.</p></div>';
                            }
                        }, 500);
                    }
                } catch (e: any) {
                    console.error('WebPartManager - Render error:', e);
                    domElement.innerHTML = '<div class="error-message">Render error: ' + e.message + '</div>';
                }
            } else {
                domElement.innerHTML = '<div class="error-message">Web part has no render method</div>';
            }
        } catch (e: any) {
            console.error('Setup error:', e);
            domElement.innerHTML = '<div class="error-message">Setup error: ' + e.message + '</div>';
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
        }
    }

    private showDebugInfo(domElement: HTMLElement, manifest: IWebPartManifest, _properties: any): void {
        const amdModules = window.__amdModules!;
        let debugHtml = '<div style="padding:20px;color:#605e5c;">';
        debugHtml += '<p><strong>' + manifest.alias + '</strong> bundle loaded.</p>';
        debugHtml += '<p style="font-size:12px;color:#a80000;">Could not find web part class.</p>';
        debugHtml += '<p style="font-size:12px;"><strong>Manifest ID:</strong> ' + manifest.id + '</p>';
        debugHtml += '<p style="font-size:12px;"><strong>Available modules:</strong></p>';
        debugHtml += '<ul style="font-size:11px;max-height:200px;overflow:auto;">';
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
