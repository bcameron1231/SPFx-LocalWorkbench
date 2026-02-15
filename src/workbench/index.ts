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
    getThemes,
    getCurrentTheme,
    setCurrentTheme,
    getCustomThemes,
    IWorkbenchSettings,
    IContextConfig
} from './config';

// Types
export * from './types';

// Storybook
export { StoryGenerator, StorybookServerManager, StorybookPanel, StorybookPanelSerializer } from './storybook';
export type { IStorybookServerOptions, ServerStatus } from './storybook/StorybookServerManager';

// HTML generation (for advanced usage)
export { generateWorkbenchHtml, generateErrorHtml } from './html';
