// Workbench Configuration
// 
// This module handles reading and providing extension settings to the workbench.

import * as vscode from 'vscode';
import { DEFAULT_MICROSOFT_THEMES, type ITheme } from './DefaultThemes';

// Context configuration for SharePoint mock
export interface IContextConfig {
    siteUrl: string;
    webUrl: string;
    userDisplayName: string;
    userEmail: string;
    userLoginName: string;
    culture: string;
    isAnonymousGuestUser: boolean;
    customContext: Record<string, unknown>;
}

// Page context configuration
export interface IPageContextConfig {
    webTitle: string;
    webDescription: string;
    webTemplate: string;
    isNoScriptEnabled: boolean;
    isSPO: boolean;
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
    pageContext: IPageContextConfig;
    theme: IThemeConfig;
}

// Default configuration values
const defaults: IWorkbenchSettings = {
    serveUrl: 'https://localhost:4321',
    autoOpenWorkbench: false,
    context: {
        siteUrl: 'https://contoso.sharepoint.com/sites/devsite',
        webUrl: 'https://contoso.sharepoint.com/sites/devsite',
        userDisplayName: 'Local Workbench User',
        userEmail: 'user@contoso.onmicrosoft.com',
        userLoginName: 'i:0#.f|membership|user@contoso.onmicrosoft.com',
        culture: 'en-US',
        isAnonymousGuestUser: false,
        customContext: {}
    },
    pageContext: {
        webTitle: 'Local Workbench',
        webDescription: 'Local development workbench for SPFx web parts',
        webTemplate: 'STS#3',
        isNoScriptEnabled: false,
        isSPO: true
    },
    theme: {
        preset: 'teamSite',
        customColors: {}
    }
};

// Gets the current workbench configuration from VS Code settings
export function getWorkbenchSettings(): IWorkbenchSettings {
    const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');

    return {
        serveUrl: config.get<string>('serveUrl', defaults.serveUrl),
        autoOpenWorkbench: config.get<boolean>('autoOpenWorkbench', defaults.autoOpenWorkbench),
        context: {
            siteUrl: config.get<string>('context.siteUrl', defaults.context.siteUrl),
            webUrl: config.get<string>('context.webUrl', defaults.context.webUrl),
            userDisplayName: config.get<string>('context.userDisplayName', defaults.context.userDisplayName),
            userEmail: config.get<string>('context.userEmail', defaults.context.userEmail),
            userLoginName: config.get<string>('context.userLoginName', defaults.context.userLoginName),
            culture: config.get<string>('context.culture', defaults.context.culture),
            isAnonymousGuestUser: config.get<boolean>('context.isAnonymousGuestUser', defaults.context.isAnonymousGuestUser),
            customContext: config.get<Record<string, unknown>>('context.customContext', defaults.context.customContext)
        },
        pageContext: {
            webTitle: config.get<string>('pageContext.webTitle', defaults.pageContext.webTitle),
            webDescription: config.get<string>('pageContext.webDescription', defaults.pageContext.webDescription),
            webTemplate: config.get<string>('pageContext.webTemplate', defaults.pageContext.webTemplate),
            isNoScriptEnabled: config.get<boolean>('pageContext.isNoScriptEnabled', defaults.pageContext.isNoScriptEnabled),
            isSPO: config.get<boolean>('pageContext.isSPO', defaults.pageContext.isSPO)
        },
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
        ...DEFAULT_MICROSOFT_THEMES,
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
    return theme || DEFAULT_MICROSOFT_THEMES[0];
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
