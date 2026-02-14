// Configuration Module Index
// 
// Re-exports all configuration-related types and functions.

export {
    IWorkbenchSettings,
    IContextConfig,
    IPageContextConfig,
    IThemeConfig,
    getWorkbenchSettings,
    onConfigurationChanged,
    openWorkbenchSettings,
    serializeSettings,
    getThemes,
    getCurrentTheme,
    setCurrentTheme,
    getCustomThemes
} from './WorkbenchConfig';

export {
    IThemePalette,
    ITheme,
    DEFAULT_MICROSOFT_THEMES
} from './DefaultThemes';
