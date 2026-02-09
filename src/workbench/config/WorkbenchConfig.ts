// Workbench Configuration
// 
// This module handles reading and providing extension settings to the workbench.

import * as vscode from 'vscode';

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
