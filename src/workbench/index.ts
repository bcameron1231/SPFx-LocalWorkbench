// Workbench Module Index
// 
// This is the main entry point for the workbench module.
// It re-exports all public APIs.

// Main panel class
export { WorkbenchPanel } from './WorkbenchPanel';

// Project detection
export { SpfxProjectDetector, createManifestWatcher } from './SpfxProjectDetector';

// Configuration
export { 
    getWorkbenchSettings, 
    onConfigurationChanged, 
    openWorkbenchSettings,
    IWorkbenchSettings,
    IContextConfig,
    IPageContextConfig,
    IThemeConfig
} from './config';

// Types
export * from './types';

// HTML generation (for advanced usage)
export { generateWorkbenchHtml, generateErrorHtml } from './html';

// API Proxy
export { ApiProxyService } from './proxy';
