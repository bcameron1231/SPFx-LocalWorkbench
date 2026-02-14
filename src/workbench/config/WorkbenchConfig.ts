// Workbench Configuration
// 
// This module handles reading and providing extension settings to the workbench.

import * as vscode from 'vscode';
import { MICROSOFT_THEMES, DEFAULT_PAGE_CONTEXT, type ITheme, type IPageContextConfig } from '@spfx-local-workbench/shared';

// Context configuration for SharePoint mock
// NOTE: Default values come from @spfx-local-workbench/shared package (DEFAULT_PAGE_CONTEXT).
// This ensures consistency across extension, webview, and Storybook addon.
// package.json still duplicates these for VS Code settings UI schema (JSON limitation).
export interface IContextConfig {
    pageContext: IPageContextConfig;
}

// Theme configuration
export interface IThemeConfig {
    preset: 'teamSite' | 'communicationSite' | 'dark' | 'highContrast' | 'custom';
    customColors: Record<string, string>;
}

// Complete workbench configuration
export interface IWorkbenchSettings {
    serveUrl: string;
    autoOpenWorkbench: boolean;
    context: IContextConfig;
    theme: IThemeConfig;
}

// Default configuration values
const defaults = {
    serveUrl: 'https://localhost:4321',
    autoOpenWorkbench: false,
    context: {
        pageContext: DEFAULT_PAGE_CONTEXT
    },
    theme: {
        preset: 'teamSite' as const,
        customColors: {}
    }
};

// Gets the current workbench configuration from VS Code settings
export function getWorkbenchSettings(): IWorkbenchSettings {
    const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');

    // Get context with pageContext nested structure
    const context = config.get<IContextConfig>('context', defaults.context);

    return {
        serveUrl: config.get<string>('serveUrl', defaults.serveUrl),
        autoOpenWorkbench: config.get<boolean>('autoOpenWorkbench', defaults.autoOpenWorkbench),
        context,
        theme: {
            preset: config.get<IThemeConfig['preset']>('theme.preset', defaults.theme.preset),
            customColors: config.get<Record<string, string>>('theme.customColors', defaults.theme.customColors)
        }
    };
}

// Creates a configuration change listener
// @param callback Function to call when configuration changes
// @returns Disposable to unsubscribe
export function onConfigurationChanged(callback: (settings: IWorkbenchSettings) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('spfxLocalWorkbench')) {
            callback(getWorkbenchSettings());
        }
    });
}

// Opens the settings UI filtered to SPFx Local Workbench settings
export async function openWorkbenchSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:BeauCameron.spfx-local-workbench');
}

// Serializes the settings to JSON for passing to the webview
export function serializeSettings(settings: IWorkbenchSettings): string {
    return JSON.stringify(settings);
}

// ============================================================================
// Theme Management Functions
// ============================================================================

/**
 * Gets all available themes (Microsoft default + custom)
 * @returns Array of all themes
 */
export function getThemes(): ITheme[] {
    const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');
    const customThemes = config.get<ITheme[]>('themes', []);
    
    // Merge Microsoft themes with custom themes
    // Custom themes have isCustom: true
    return [
        ...MICROSOFT_THEMES,
        ...customThemes.map(theme => ({ ...theme, isCustom: true }))
    ];
}

/**
 * Gets the currently selected theme
 * @returns Current theme (defaults to Teal if not set)
 */
export function getCurrentTheme(): ITheme {
    const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');
    const currentThemeId = config.get<string>('currentThemeId', 'teal');
    
    const allThemes = getThemes();
    const theme = allThemes.find(t => t.id === currentThemeId);
    
    // Default to Teal if theme not found
    return theme || MICROSOFT_THEMES[0];
}

/**
 * Sets the current theme
 * @param themeId ID of the theme to set as current
 */
export async function setCurrentTheme(themeId: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');
    await config.update('currentThemeId', themeId, vscode.ConfigurationTarget.Workspace);
}

/**
 * Gets custom themes from configuration
 * @returns Array of custom themes only
 */
export function getCustomThemes(): ITheme[] {
    const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');
    return config.get<ITheme[]>('themes', []).map(theme => ({ ...theme, isCustom: true }));
}
