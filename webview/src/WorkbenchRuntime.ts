// Workbench Runtime
// 
// Main runtime class that manages the SPFx local workbench

import type { IWorkbenchConfig, IWebPartManifest, IWebPartConfig, IExtensionConfig, IVsCodeApi } from './types';
import { isActiveWebPart, isActiveExtension } from './types';
import type { IAppHandlers } from './components/App';
import { AmdLoader } from './amd/AmdLoader';
import { SpfxContext } from './mocks/SpfxContext';
import { ThemeProvider } from './mocks/ThemeProvider';
import { WebPartManager } from './WebPartManager';
import { initializeSpfxMocks } from './mocks/SpfxMocks';
import { ExtensionManager } from './ExtensionManager';

export class WorkbenchRuntime {
    private vscode: IVsCodeApi;
    private config: IWorkbenchConfig;
    private amdLoader: AmdLoader;
    private contextProvider: SpfxContext;
    private themeProvider: ThemeProvider;
    private webPartManager: WebPartManager;
    private extensionManager: ExtensionManager;
    private appHandlers: IAppHandlers | null = null;
    
    private loadedManifests: IWebPartManifest[] = [];
    private activeWebParts: IWebPartConfig[] = [];
    private activeExtensions: IExtensionConfig[] = [];

    constructor(config: IWorkbenchConfig) {
        this.vscode = window.acquireVsCodeApi();
        this.config = config;

        // Initialize core components
        this.amdLoader = new AmdLoader();
        this.contextProvider = new SpfxContext(config.context, config.pageContext);
        this.themeProvider = new ThemeProvider(config.theme);
        this.webPartManager = new WebPartManager(
            this.vscode,
            config.serveUrl,
            this.contextProvider,
            this.themeProvider
        );

        this.extensionManager = new ExtensionManager(
            this.vscode,
            config.serveUrl,
            this.contextProvider,
            this.themeProvider
        );

        // Expose to window for debugging
        (window as any).__workbench = this;
    }

    setAppHandlers(handlers: IAppHandlers): void {
        this.appHandlers = handlers;
    }

    // Applies updated settings from the extension host without full reload
    updateSettings(settings: { serveUrl?: string; theme?: any; context?: any; pageContext?: any }): void {
        if (settings.serveUrl) {
            this.config.serveUrl = settings.serveUrl;
        }
        if (settings.theme) {
            this.themeProvider = new ThemeProvider(settings.theme);
        }
        if (settings.context || settings.pageContext) {
            this.contextProvider = new SpfxContext(settings.context, settings.pageContext);
        }
        console.log('[Workbench] Settings updated in-place');
    }

    async initialize(): Promise<void> {
        try {
            
            // Initialize AMD loader
            this.amdLoader.initialize();

            // Update status
            this.updateStatus('Connecting to serve at ' + this.config.serveUrl + '...');

            // Load manifests from serve
            await this.loadManifests();

            this.updateStatus('Connected');
            this.updateConnectionStatus(true);
            
            const webPartCount = this.loadedManifests.filter(m => m.componentType === 'WebPart').length;
            const extensionCount = this.loadedManifests.filter(m => m.componentType === 'Extension').length;
            this.updateComponentCount(webPartCount, extensionCount);

            // Update React app
            if (this.appHandlers) {
                this.appHandlers.setManifests(this.loadedManifests);
                this.appHandlers.setActiveWebParts(this.activeWebParts);
                this.appHandlers.setActiveExtensions(this.activeExtensions);
            }

        } catch (error: any) {
            this.updateConnectionStatus(false);
            // Error will be displayed by React component
        }
    }

    private async loadManifests(): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.config.serveUrl + '/temp/build/manifests.js?_v=' + Date.now();
            script.onload = () => {
                if (window.debugManifests?.getManifests) {
                    this.loadedManifests = window.debugManifests.getManifests();
                    const componentCount = this.loadedManifests.length;
                    const webPartCount = this.loadedManifests.filter(m => m.componentType === 'WebPart').length;
                    const extCount = this.loadedManifests.filter(m => m.componentType === 'Extension').length;
                    this.updateStatus('Loaded ' + componentCount + ' components (' + webPartCount + ' web parts, ' + extCount + ' extensions)');

                    // Update internal module base URLs - rewrite host/port
                    // but preserve the path (e.g. /dist/) so bundle paths resolve correctly
                    this.loadedManifests.forEach(m => {
                        if (m.loaderConfig?.internalModuleBaseUrls) {
                            m.loaderConfig.internalModuleBaseUrls = m.loaderConfig.internalModuleBaseUrls.map(url => {
                                try {
                                    const original = new URL(url);
                                    const serve = new URL(this.config.serveUrl);
                                    original.protocol = serve.protocol;
                                    original.hostname = serve.hostname;
                                    original.port = serve.port;
                                    return original.toString();
                                } catch {
                                    return this.config.serveUrl + '/';
                                }
                            });
                        }
                    });

                    resolve();
                } else {
                    reject(new Error('debugManifests not available'));
                }
            };
            script.onerror = () => reject(new Error('Failed to load manifests.js'));
            document.head.appendChild(script);
        });
    }

    private async loadExtensions(): Promise<void> {
        const extensionManifests = this.loadedManifests.filter(m => m.componentType === 'Extension');
        
        if (extensionManifests.length === 0) {
            return;
        }

        // Create active extension instances for each manifest
        for (const manifest of extensionManifests) {
            await this.addExtension(extensionManifests.indexOf(manifest));
        }
    }

    async addExtension(manifestIndex: number): Promise<void> {
        const extensions = this.loadedManifests.filter(m => m.componentType === 'Extension');
        const manifest = extensions[manifestIndex];

        if (!manifest) {
            console.error('WorkbenchRuntime - No manifest found at index', manifestIndex);
            return;
        }

        const instanceId = 'ext-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const properties = manifest.preconfiguredEntries?.[0]?.properties || {};

        const config: IExtensionConfig = {
            manifest: manifest,
            instanceId: instanceId,
            properties: JSON.parse(JSON.stringify(properties)),
        };

        this.activeExtensions.push(config);

        // Update React app with extension data so DOM elements are created
        if (this.appHandlers) {
            this.appHandlers.setActiveExtensions([...this.activeExtensions]);
        }

        // Allow DOM to render
        await new Promise(r => setTimeout(r, 100));

        // Instantiate the extensions
        const headerEl = document.getElementById(`ext-header-${config.instanceId}`) as HTMLDivElement;
        const footerEl = document.getElementById(`ext-footer-${config.instanceId}`) as HTMLDivElement;

        if (!headerEl || !footerEl) {
            console.error('WorkbenchRuntime - Missing DOM element(s) for extension', config.instanceId);
        }

        const active = await this.extensionManager.instantiateExtension(config, headerEl, footerEl);
        if (active) {
            const idx = this.activeExtensions.indexOf(config);
            if (idx !== -1) {
                this.activeExtensions[idx] = active;
                // Update React app with the active extension
                if (this.appHandlers) {
                    this.appHandlers.setActiveExtensions([...this.activeExtensions]);
                }
            }
        }
    }

    async removeExtension(instanceId: string): Promise<void> {
        const index = this.activeExtensions.findIndex(ext => ext.instanceId === instanceId);
        if (index === -1) {return;}
        
        const extension = this.activeExtensions[index];

        // Dispose the extension instance if active
        if (isActiveExtension(extension)) {
            if (extension.instance?.onDispose) {
                try {
                    extension.instance.onDispose();
                } catch (e: any) {
                    // Error disposing
                    console.error('Workbench - Error disposing extension:', e);
                }
            }

            // Clear DOM content
            if (extension.headerDomElement) {
                extension.headerDomElement.innerHTML = '';
            }
            if (extension.footerDomElement) {
                extension.footerDomElement.innerHTML = '';
            }
        }

        this.activeExtensions.splice(index, 1);

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.setActiveExtensions([...this.activeExtensions]);
        }
    }

    async addWebPartAt(insertIndex: number, manifestIndex: number): Promise<void> {
        const webParts = this.loadedManifests.filter(m => m.componentType === 'WebPart');
        const manifest = webParts[manifestIndex];

        if (!manifest) {
            return;
        }

        const instanceId = 'wp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const properties = manifest.preconfiguredEntries?.[0]?.properties || {};

        const config: IWebPartConfig = {
            manifest: manifest,
            instanceId: instanceId,
            properties: JSON.parse(JSON.stringify(properties)),
        };

        this.activeWebParts.splice(insertIndex, 0, config);

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.setActiveWebParts([...this.activeWebParts]);
        }

        // Allow DOM to update
        await new Promise(r => setTimeout(r, 50));

        // Instantiate the web part
        await this.instantiateWebPart(config);

        // Update React app with the active web part
        if (this.appHandlers) {
            this.appHandlers.setActiveWebParts([...this.activeWebParts]);
        }
    }

    async removeWebPart(index: number): Promise<void> {
        const webPart = this.activeWebParts[index];
        
        // Dispose the web part instance if active
        if (isActiveWebPart(webPart)) {
            if (typeof webPart.instance.onDispose === 'function') {
                try {
                    webPart.instance.onDispose();
                } catch (e: any) {
                    // Error disposing
                    console.error('Workbench - Error disposing web part:', e);
                }
            }
        }

        this.activeWebParts.splice(index, 1);

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.setActiveWebParts([...this.activeWebParts]);
        }
    }

    private async instantiateWebPart(config: IWebPartConfig): Promise<void> {
        const domElement = document.getElementById('webpart-' + config.instanceId);
        if (!domElement) {return;}

        const active = await this.webPartManager.instantiateWebPart(config, domElement);
        if (active) {
            const idx = this.activeWebParts.findIndex(wp => wp.instanceId === config.instanceId);
            if (idx !== -1) {
                this.activeWebParts[idx] = active;
            }
        }
    }

    openPropertyPane(webPart: IWebPartConfig): void {
        if (this.appHandlers && isActiveWebPart(webPart)) {
            this.appHandlers.openPropertyPane(webPart);
        }
    }
    
    updateWebPartProperty(instanceId: string, targetProperty: string, newValue: any): void {
        const webPart = this.activeWebParts.find(wp => wp.instanceId === instanceId);
        if (!webPart) {return;}

        // Update property
        webPart.properties[targetProperty] = newValue;

        // Call lifecycle methods and re-render if instantiated
        if (isActiveWebPart(webPart)) {
            if (typeof webPart.instance.onPropertyPaneFieldChanged === 'function') {
                try {
                    webPart.instance.onPropertyPaneFieldChanged(targetProperty, null, newValue);
                } catch (e: any) {
                    console.error('Workbench - Error calling onPropertyPaneFieldChanged:', e);
                }
            }

            if (typeof webPart.instance.render === 'function') {
                try {
                    webPart.instance.render();
                } catch (e: any) {
                    console.error('Workbench - Error rendering web part:', e);
                }
            }
        }

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.updateWebPartProperties(instanceId, { ...webPart.properties });
        }
    }

    async updateExtensionProperties(instanceId: string, properties: Record<string, any>): Promise<void> {
        const extIndex = this.activeExtensions.findIndex(ext => ext.instanceId === instanceId);
        if (extIndex === -1) {return;}

        const extension = this.activeExtensions[extIndex];

        // Dispose the current extension instance if active
        if (isActiveExtension(extension)) {
            if (extension.instance?.onDispose) {
                try {
                    extension.instance.onDispose();
                } catch (e: any) {
                    console.error('Workbench - Error disposing extension:', e);
                }
            }

            // Clear DOM content
            if (extension.headerDomElement) {
                extension.headerDomElement.innerHTML = '';
            }
            if (extension.footerDomElement) {
                extension.footerDomElement.innerHTML = '';
            }
        }

        // Replace with a fresh config (strips runtime state)
        const config: IExtensionConfig = {
            manifest: extension.manifest,
            instanceId: extension.instanceId,
            properties: { ...properties },
        };
        this.activeExtensions[extIndex] = config;

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.setActiveExtensions([...this.activeExtensions]);
        }

        // Allow DOM to render
        await new Promise(r => setTimeout(r, 100));

        // Re-instantiate with new properties
        const headerEl = document.getElementById(`ext-header-${config.instanceId}`) as HTMLDivElement;
        const footerEl = document.getElementById(`ext-footer-${config.instanceId}`) as HTMLDivElement;

        if (headerEl && footerEl) {
            const active = await this.extensionManager.instantiateExtension(config, headerEl, footerEl);
            if (active) {
                this.activeExtensions[extIndex] = active;
            }
        }
    }

    async liveReload(): Promise<void> {
        console.log('[Workbench] Live reload triggered — reloading bundles...');
        this.updateStatus('Reloading...');

        // Strip runtime state back to configs
        this.activeWebParts = this.activeWebParts.map(wp => ({
            manifest: wp.manifest,
            instanceId: wp.instanceId,
            properties: wp.properties
        }));

        this.activeExtensions = this.activeExtensions.map(ext => ({
            manifest: ext.manifest,
            instanceId: ext.instanceId,
            properties: ext.properties
        }));

        if (window.__amdModules) {
            for (const key of Object.keys(window.__amdModules)) {
                delete window.__amdModules[key];
            }
        }

        initializeSpfxMocks();

        const serveOrigin = new URL(this.config.serveUrl).origin;
        document.querySelectorAll('script[src]').forEach(script => {
            const src = script.getAttribute('src') || '';
            if (src.startsWith(serveOrigin)) {
                script.remove();
            }
        });

        try {
            await this.loadManifests();

            const webPartCount = this.loadedManifests.filter(m => m.componentType === 'WebPart').length;
            const extensionCount = this.loadedManifests.filter(m => m.componentType === 'Extension').length;
            this.updateComponentCount(webPartCount, extensionCount);

            if (this.appHandlers) {
                this.appHandlers.setManifests(this.loadedManifests);
            }
        } catch (error: any) {
            console.error('[Workbench] Live reload — failed to load manifests:', error);
            this.updateStatus('Reload failed: ' + (error.message || error));
            return;
        }

        for (let i = 0; i < this.activeWebParts.length; i++) {
            const wp = this.activeWebParts[i];
            const domElement = document.getElementById('webpart-' + wp.instanceId);
            if (domElement) {
                const active = await this.webPartManager.instantiateWebPart(wp, domElement);
                if (active) {
                    this.activeWebParts[i] = active;
                }
            }
        }

        for (let i = 0; i < this.activeExtensions.length; i++) {
            const ext = this.activeExtensions[i];
            const headerEl = document.getElementById(`ext-header-${ext.instanceId}`) as HTMLDivElement;
            if (headerEl) {
                const active = await this.extensionManager.instantiateExtension(ext, headerEl, headerEl);
                if (active) {
                    this.activeExtensions[i] = active;
                }
            }
        }

        // Update React app with the re-instantiated components
        if (this.appHandlers) {
            this.appHandlers.setActiveWebParts([...this.activeWebParts]);
            this.appHandlers.setActiveExtensions([...this.activeExtensions]);
        }

        this.updateStatus('Reloaded');
        this.updateConnectionStatus(true);
        console.log('[Workbench] Live reload complete');
    }

    handleRefresh(): void {
        this.vscode.postMessage({ command: 'refresh' });
    }

    handleOpenDevTools(): void {
        this.vscode.postMessage({ command: 'openDevTools' });
    }

    private updateStatus(message: string): void {
        const loadingStatus = document.getElementById('loading-status');
        const statusText = document.getElementById('status-text');
        if (loadingStatus) {loadingStatus.textContent = message;}
        if (statusText) {statusText.textContent = message;}
    }

    private updateConnectionStatus(connected: boolean): void {
        const statusDot = document.getElementById('status-dot');
        if (statusDot) {
            if (connected) {
                statusDot.classList.remove('disconnected');
            } else {
                statusDot.classList.add('disconnected');
            }
        }
    }

    private updateComponentCount(webpartCount: number, extensionCount?: number): void {
        const componentCountEl = document.getElementById('component-count');
        if (componentCountEl) {
            let text = `${webpartCount} web part${webpartCount === 1 ? '' : 's'}`;
            if (extensionCount && extensionCount > 0) {
                text += `, ${extensionCount} extension${extensionCount === 1 ? '' : 's'}`;
            }
            text += ' available';
            componentCountEl.textContent = text;
        }
    }

    // Public API for debugging
    getActiveWebParts(): IWebPartConfig[] {
        return this.activeWebParts;
    }

    getLoadedManifests(): IWebPartManifest[] {
        return this.loadedManifests;
    }
}
