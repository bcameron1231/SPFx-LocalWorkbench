// Workbench Configuration
//
// This module handles reading and providing extension settings to the workbench.
import * as vscode from 'vscode';

import {
  DEFAULT_PAGE_CONTEXT,
  DEFAULT_THEME_NAME,
  type IPageContextConfig,
  type ITheme,
  MICROSOFT_THEMES,
} from '@spfx-local-workbench/shared';

// Context configuration for SharePoint mock
// NOTE: Default values come from @spfx-local-workbench/shared package (DEFAULT_PAGE_CONTEXT).
// This ensures consistency across extension, webview, and Storybook addon.
// package.json still duplicates these for VS Code settings UI schema (JSON limitation).
export interface IContextConfig {
  pageContext: IPageContextConfig;
}

// Complete workbench configuration
export interface IWorkbenchSettings {
  serveUrl: string;
  autoOpenWorkbench: boolean;
  serveCommand: string;
  context: IContextConfig;
}

// Default configuration values
const defaults = {
  serveUrl: 'https://localhost:4321',
  autoOpenWorkbench: false,
  serveCommand: 'heft start --clean --nobrowser',
  context: {
    pageContext: DEFAULT_PAGE_CONTEXT,
  },
};

// Gets the current workbench configuration from VS Code settings
export function getWorkbenchSettings(): IWorkbenchSettings {
  const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');

  // Get pageContext and wrap it in context object structure
  const pageContext = config.get<IPageContextConfig>(
    'context.pageContext',
    defaults.context.pageContext,
  );

  return {
    serveUrl: config.get<string>('serveUrl', defaults.serveUrl),
    autoOpenWorkbench: config.get<boolean>('autoOpenWorkbench', defaults.autoOpenWorkbench),
    serveCommand: config.get<string>('serveCommand', defaults.serveCommand),
    context: {
      pageContext,
    },
  };
}

// Creates a configuration change listener
// @param callback Function to call when configuration changes
// @returns Disposable to unsubscribe
export function onConfigurationChanged(
  callback: (settings: IWorkbenchSettings) => void,
): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('spfxLocalWorkbench')) {
      callback(getWorkbenchSettings());
    }
  });
}

// Opens the settings UI filtered to SPFx Local Workbench settings
export async function openWorkbenchSettings(): Promise<void> {
  await vscode.commands.executeCommand(
    'workbench.action.openSettings',
    '@ext:BeauCameron.spfx-local-workbench',
  );
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
  const customThemes = config.get<ITheme[]>('theme.custom', []);

  // Merge Microsoft themes with custom themes
  // Custom themes have isCustom: true
  return [...MICROSOFT_THEMES, ...customThemes.map((theme) => ({ ...theme, isCustom: true }))];
}

/**
 * Gets the currently selected theme
 * @returns Current theme (defaults to Teal if not set)
 */
export function getCurrentTheme(): ITheme {
  const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');
  const theme = config.get<string>('theme.current', DEFAULT_THEME_NAME);
  const customTheme = config.get<string>('theme.customId', '');

  // Use custom theme ID if theme is set to 'custom'
  const currentThemeName = theme === 'custom' ? customTheme : theme;

  const allThemes = getThemes();
  const foundTheme = allThemes.find((t) => t.name === currentThemeName);

  // Default to Teal if theme not found
  return foundTheme || MICROSOFT_THEMES[0];
}

/**
 * Sets the current theme
 * @param themeName Name of the theme to set as current
 */
export async function setCurrentTheme(themeName: string): Promise<void> {
  const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');

  // Check if this is a Microsoft theme
  const isMicrosoftTheme = MICROSOFT_THEMES.some((t) => t.name === themeName);

  if (isMicrosoftTheme) {
    // Set theme to the Microsoft theme name
    await config.update('theme.current', themeName, vscode.ConfigurationTarget.Workspace);
  } else {
    // Set theme to 'custom' and store the name in customName
    await config.update('theme.current', 'custom', vscode.ConfigurationTarget.Workspace);
    await config.update('theme.customName', themeName, vscode.ConfigurationTarget.Workspace);
  }
}

/**
 * Gets custom themes from configuration
 * @returns Array of custom themes only
 */
export function getCustomThemes(): ITheme[] {
  const config = vscode.workspace.getConfiguration('spfxLocalWorkbench');
  return config.get<ITheme[]>('theme.custom', []).map((theme) => ({ ...theme, isCustom: true }));
}
