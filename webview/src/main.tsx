// Main Entry Point for Webview
// 
// This is the entry point that gets bundled and loaded in the webview

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { WorkbenchRuntime } from './WorkbenchRuntime';
import { App, IAppHandlers } from './components/App';
import { logger, getErrorMessage } from '@spfx-local-workbench/shared';
import './styles/global.css';

const log = logger.createChild('Main');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

function initialize() {
    try {
        // Get configuration injected by the extension
        const config = window.__workbenchConfig;

        if (!config) {
            throw new Error('Workbench configuration not found');
        }

        // Create the workbench runtime
        const runtime = new WorkbenchRuntime(config);

        // Setup event listeners for React -> Runtime communication
        window.addEventListener('addWebPart', ((e: CustomEvent) => {
            runtime.addWebPartAt(e.detail.insertIndex, e.detail.manifestIndex);
        }) as EventListener);

        window.addEventListener('deleteWebPart', ((e: CustomEvent) => {
            runtime.removeWebPart(e.detail.index);
        }) as EventListener);

        window.addEventListener('addExtension', ((e: CustomEvent) => {
            runtime.addExtension(e.detail.manifestIndex);
        }) as EventListener);

        window.addEventListener('removeExtension', ((e: CustomEvent) => {
            runtime.removeExtension(e.detail.instanceId);
        }) as EventListener);

        window.addEventListener('updateProperty', ((e: CustomEvent) => {
            runtime.updateWebPartProperty(
                e.detail.instanceId,
                e.detail.targetProperty,
                e.detail.newValue
            );
        }) as EventListener);

        window.addEventListener('updateExtensionProperties', ((e: CustomEvent) => {
            runtime.updateExtensionProperties(
                e.detail.instanceId,
                e.detail.properties
            );
        }) as EventListener);

        window.addEventListener('refresh', (() => {
            runtime.handleRefresh();
        }) as EventListener);

        window.addEventListener('openDevTools', (() => {
            runtime.handleOpenDevTools();
        }) as EventListener);

        // Listen for live reload messages from the extension
        window.addEventListener('message', (event: MessageEvent) => {
            const message = event.data;
            if (!message || !message.command) {
                return;
            }

            switch (message.command) {
                case 'liveReload':
                    runtime.liveReload();
                    return;
                case 'refresh':
                    runtime.handleRefresh();
                    return;
                case 'openDevTools':
                    runtime.handleOpenDevTools();
                    return;
            }
            if (message && message.command === 'settingsChanged' && message.settings) {
                runtime.updateSettings(message.settings);
            }
        });

        // Mount React app
        const root = document.getElementById('root');
        if (!root) {
            throw new Error('Root element not found');
        }

        ReactDOM.render(
            React.createElement(App, {
                config: config,
                onInitialized: (handlers: IAppHandlers) => {
                    log.debug('React app initialized, handlers received');
                    runtime.setAppHandlers(handlers);
                    // Initialize the runtime after React app is ready
                    log.debug('Calling runtime.initialize()');
                    runtime.initialize().catch(error => {
                        log.error('Initialization error:', error);
                    });
                }
            }),
            root
        );

    } catch (globalError: unknown) {
        log.error('Fatal initialization error:', globalError);
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = `
                <div style="padding: 20px;">
                    <div class="error-message">
                        <strong>Fatal Error:</strong> ${getErrorMessage(globalError)}
                    </div>
                    <p style="padding: 16px;">
                        The workbench failed to initialize. Please check the console for details.
                    </p>
                </div>
            `;
        }
    }
}
