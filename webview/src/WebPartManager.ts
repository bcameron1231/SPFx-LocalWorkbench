// Web Part Manager
// 
// Handles loading, instantiation, and lifecycle of SPFx web parts

import type { IWebPartManifest, IWebPartConfig, IActiveWebPart, IVsCodeApi } from './types';
import { BundleLoader, StringsLoader, ComponentResolver } from '@spfx-local-workbench/shared';
import { SpfxContext, ThemeProvider } from './mocks';

export class WebPartManager {
    private vscode: IVsCodeApi;
    private bundleLoader: BundleLoader;
    private stringsLoader: StringsLoader;
    private componentResolver: ComponentResolver;
    private contextProvider: SpfxContext;
    private themeProvider: ThemeProvider;

    constructor(
        vscode: IVsCodeApi,
        serveUrl: string,
        contextProvider: SpfxContext,
        themeProvider: ThemeProvider
    ) {
        this.vscode = vscode;
        this.bundleLoader = new BundleLoader(serveUrl);
        this.stringsLoader = new StringsLoader(serveUrl);
        this.componentResolver = new ComponentResolver();
        this.contextProvider = contextProvider;
        this.themeProvider = themeProvider;
    }

    async loadWebPartBundle(manifest: IWebPartManifest): Promise<string[]> {
        return this.bundleLoader.loadBundle(manifest);
    }

    async loadWebPartStrings(manifest: IWebPartManifest, localeOverride?: string): Promise<void> {
        return this.stringsLoader.loadStrings(manifest, localeOverride);
    }

    async instantiateWebPart(config: IWebPartConfig, domElement: HTMLElement, localeOverride?: string): Promise<IActiveWebPart | undefined> {
        if (!domElement) {
            return;
        }

        try {
            await this.loadWebPartStrings(config.manifest, localeOverride);
            const newModules = await this.loadWebPartBundle(config.manifest);
            await new Promise(r => setTimeout(r, 100));

            const context = this.contextProvider.createMockContext(
                config.manifest.id,
                config.instanceId
            );
            context.domElement = domElement;

            const WebPartClass = this.findWebPartClass(config.manifest, newModules);

            if (WebPartClass && typeof WebPartClass === 'function') {
                return await this.renderWebPartFromClass(WebPartClass, config, context, domElement);
            }

            // Show debug info if we couldn't find the class
            this.showDebugInfo(domElement, config.manifest, config.properties);
            return;

        } catch (error: any) {
            domElement.innerHTML = '<div class="error-message">Failed to load: ' + error.message + '</div>';
            return;
        }
    }

    private findWebPartClass(manifest: IWebPartManifest, candidateModules?: string[]): any {
        return this.componentResolver.findComponentClass(manifest, candidateModules);
    }

    private async renderWebPartFromClass(
        WebPartClass: any,
        config: IWebPartConfig,
        context: any,
        domElement: HTMLElement
    ): Promise<IActiveWebPart> {
        try {
            const instance = new WebPartClass();
            const active: IActiveWebPart = {
                ...config,
                context,
                instance
            };

            // Set up the instance with our mock context
            instance._context = active.context;
            this.setupProperty(instance, 'context', () => active.context);

            instance._domElement = domElement;
            this.setupProperty(instance, 'domElement', () => domElement);

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

            return active;
        } catch (e: any) {
            console.error('Setup error:', e);
            domElement.innerHTML = '<div class="error-message">Setup error: ' + e.message + '</div>';
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
        }
    }

    private showDebugInfo(domElement: HTMLElement, manifest: IWebPartManifest, _properties: any): void {
        let debugHtml = '<div style="padding:20px;color:#605e5c;">';
        debugHtml += '<p><strong>' + manifest.alias + '</strong> bundle loaded.</p>';
        debugHtml += '<p style="font-size:12px;color:#a80000;">Could not find web part class.</p>';
        debugHtml += '<p style="font-size:12px;"><strong>Manifest ID:</strong> ' + manifest.id + '</p>';
        debugHtml += '<p style="font-size:12px;"><strong>Available modules:</strong></p>';
        debugHtml += '<ul style="font-size:11px;max-height:200px;overflow:auto;">';
        
        const moduleNames = this.componentResolver.getModuleNames();
        for (const name of moduleNames) {
            const mod = this.componentResolver.getModule(name);
            const modType = typeof mod;
            const modKeys = mod ? Object.keys(mod).slice(0, 5).join(', ') : 'null';
            debugHtml += '<li><strong>' + name + '</strong>: ' + modType + ' [' + modKeys + ']</li>';
        }
        debugHtml += '</ul>';
        debugHtml += '</div>';
        domElement.innerHTML = debugHtml;
    }
}
