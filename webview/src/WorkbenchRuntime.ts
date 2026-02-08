// Workbench Runtime
// 
// Main runtime class that manages the SPFx local workbench

import type { IWorkbenchConfig, IWebPartManifest, IActiveWebPart, IActiveExtension, IVsCodeApi } from './types';
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
    private activeWebParts: IActiveWebPart[] = [];
    private activeExtensions: IActiveExtension[] = [];

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

        // Setup event listeners after a short delay to ensure DOM is ready
        setTimeout(() => this.setupEventListeners(), 100);

        // Expose to window for debugging
        (window as any).__workbench = this;
    }

    setAppHandlers(handlers: IAppHandlers): void {
        this.appHandlers = handlers;
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
            this.updateWebPartCount(webPartCount, extensionCount);

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

        const extension: IActiveExtension = {
            manifest: manifest,
            instanceId: instanceId,
            properties: JSON.parse(JSON.stringify(properties)),
            context: null,
            instance: null,
            headerDomElement: null,
            footerDomElement: null
        };

        this.activeExtensions.push(extension);

        // Update React app with extension data so DOM elements are created
        if (this.appHandlers) {
            this.appHandlers.setActiveExtensions([...this.activeExtensions]);
        }

        // Allow DOM to render
        await new Promise(r => setTimeout(r, 100));

        // Instantiate the extension
        const headerEl = document.getElementById(`ext-header-${extension.instanceId}`) as HTMLDivElement;

        if (!headerEl) {
            console.error('WorkbenchRuntime - Missing DOM element for extension', extension.instanceId);
            return;
        }

        // Pass the header element for both placeholders so all content renders in one place
        await this.extensionManager.instantiateExtension(extension, headerEl, headerEl);
    }

    async removeExtension(instanceId: string): Promise<void> {
        const index = this.activeExtensions.findIndex(ext => ext.instanceId === instanceId);
        if (index === -1) return;
        
        const extension = this.activeExtensions[index];

        // Dispose the extension instance
        if (extension?.instance?.onDispose) {
            try {
                extension.instance.onDispose();
            } catch (e: any) {
                // Error disposing
            }
        }

        // Clear DOM content
        if (extension?.headerDomElement) {
            extension.headerDomElement.innerHTML = '';
        }
        if (extension?.footerDomElement) {
            extension.footerDomElement.innerHTML = '';
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

        const webPart: IActiveWebPart = {
            manifest: manifest,
            instanceId: instanceId,
            properties: JSON.parse(JSON.stringify(properties)),
            context: null,
            instance: null
        };

        this.activeWebParts.splice(insertIndex, 0, webPart);

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.setActiveWebParts([...this.activeWebParts]);
        }

        // Allow DOM to update
        await new Promise(r => setTimeout(r, 50));

        // Instantiate the web part
        await this.instantiateWebPart(webPart, insertIndex);
    }

    async removeWebPart(index: number): Promise<void> {
        const webPart = this.activeWebParts[index];
        
        // Dispose the web part instance
        if (webPart?.instance?.dispose) {
            try {
                webPart.instance.dispose();
            } catch (e: any) {
                // Error disposing
            }
        }

        this.activeWebParts.splice(index, 1);

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.setActiveWebParts([...this.activeWebParts]);
        }

        // Allow DOM to update
        await new Promise(r => setTimeout(r, 50));

        // Re-instantiate remaining web parts
        for (let i = 0; i < this.activeWebParts.length; i++) {
            await this.instantiateWebPart(this.activeWebParts[i], i);
        }
    }

    private async instantiateWebPart(webPart: IActiveWebPart, index: number): Promise<void> {
        const domElement = document.getElementById('webpart-' + index);
        if (!domElement) return;

        await this.webPartManager.instantiateWebPart(webPart, domElement);
    }

    openPropertyPane(webPart: IActiveWebPart): void {
        if (this.appHandlers) {
            this.appHandlers.openPropertyPane(webPart);
        }
    }
    
    updateWebPartProperty(instanceId: string, targetProperty: string, newValue: any): void {
        const webPart = this.activeWebParts.find(wp => wp.instanceId === instanceId);
        if (!webPart) return;

        // Update property
        webPart.properties[targetProperty] = newValue;

        // Call onPropertyPaneFieldChanged lifecycle if available
        if (webPart.instance && typeof webPart.instance.onPropertyPaneFieldChanged === 'function') {
            try {
                webPart.instance.onPropertyPaneFieldChanged(targetProperty, null, newValue);
            } catch (e: any) {
                console.error('Workbench - Error calling onPropertyPaneFieldChanged:', e);
            }
        }

        // Re-render the web part
        if (webPart.instance && typeof webPart.instance.render === 'function') {
            try {
                webPart.instance.render();
            } catch (e: any) {
                console.error('Workbench - Error rendering web part:', e);
            }
        }

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.updateWebPartProperties(instanceId, { ...webPart.properties });
        }
    }

    async updateExtensionProperties(instanceId: string, properties: Record<string, any>): Promise<void> {
        const extIndex = this.activeExtensions.findIndex(ext => ext.instanceId === instanceId);
        if (extIndex === -1) return;

        const extension = this.activeExtensions[extIndex];

        // Dispose the current extension instance
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

        // Update properties
        extension.properties = { ...properties };
        extension.instance = null;
        extension.context = null;

        // Update React app
        if (this.appHandlers) {
            this.appHandlers.setActiveExtensions([...this.activeExtensions]);
        }

        // Allow DOM to render
        await new Promise(r => setTimeout(r, 100));

        // Re-instantiate with new properties
        const headerEl = document.getElementById(`ext-header-${extension.instanceId}`) as HTMLDivElement;
        const footerEl = document.getElementById(`ext-footer-${extension.instanceId}`) as HTMLDivElement;

        if (headerEl && footerEl) {
            await this.extensionManager.instantiateExtension(extension, headerEl, footerEl);
        }
    }

    private setupEventListeners(): void {
        // Toolbar buttons are now handled by React Toolbar component in App.tsx
        // Event listeners for toolbar actions are in main.tsx
    }
    async liveReload(): Promise<void> {
        console.log('[Workbench] Live reload triggered — reloading bundles...');
        this.updateStatus('Reloading...');

        for (const wp of this.activeWebParts) {
            wp.instance = null;
        }

        for (const ext of this.activeExtensions) {
            ext.instance = null;
        }

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
            this.updateWebPartCount(webPartCount, extensionCount);

            if (this.appHandlers) {
                this.appHandlers.setManifests(this.loadedManifests);
            }
        } catch (error: any) {
            console.error('[Workbench] Live reload — failed to load manifests:', error);
            this.updateStatus('Reload failed: ' + (error.message || error));
            return;
        }

        for (let i = 0; i < this.activeWebParts.length; i++) {
            const domElement = document.getElementById('webpart-' + i);
            if (domElement) {
                await this.webPartManager.instantiateWebPart(this.activeWebParts[i], domElement);
            }
        }

        for (const ext of this.activeExtensions) {
            const headerEl = document.getElementById(`ext-header-${ext.instanceId}`) as HTMLDivElement;
            if (headerEl) {
                await this.extensionManager.instantiateExtension(ext, headerEl, headerEl);
            }
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
        if (loadingStatus) loadingStatus.textContent = message;
        if (statusText) statusText.textContent = message;
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

    private updateWebPartCount(count: number, extensionCount?: number): void {
        const webPartCountEl = document.getElementById('webpart-count');
        if (webPartCountEl) {
            let text = count + ' web part(s) available';
            if (extensionCount && extensionCount > 0) {
                text += ', ' + extensionCount + ' extension(s)';
            }
            webPartCountEl.textContent = text;
        }
    }

    // Public API for debugging
    getActiveWebParts(): IActiveWebPart[] {
        return this.activeWebParts;
    }

    getLoadedManifests(): IWebPartManifest[] {
        return this.loadedManifests;
    }
}
