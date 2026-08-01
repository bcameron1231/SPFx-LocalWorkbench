/**
 * Constants for the SPFx Storybook addon
 */

// Re-export DisplayMode from shared package for backwards compatibility
export { DisplayMode } from '@spfx-local-workbench/shared';

export const ADDON_ID = 'spfx-addon';

export const PARAM_KEY = 'spfx';

export const TOOLBAR_IDS = {
  DISPLAY_MODE: `${ADDON_ID}/display-mode`,
  PROPERTY_PANE: `${ADDON_ID}/property-pane`,
  THEME: `${ADDON_ID}/theme`,
  SCENARIO: `${ADDON_ID}/scenario`,
  LOCALE: `${ADDON_ID}/locale`,
} as const;

export const EVENTS = {
  LOCALE_CHANGED: `${ADDON_ID}/locale-changed`,
} as const;

export const STORYBOOK_GLOBAL_KEYS = {
  DISPLAY_MODE: `${PARAM_KEY}DisplayMode`,
  PROPERTY_PANE_OPEN: `${PARAM_KEY}PropertyPaneOpen`,
  THEME: `${PARAM_KEY}Theme`,
  LOCALE: `${PARAM_KEY}Locale`,
  CUSTOM_THEMES: `${PARAM_KEY}CustomThemes`,
  /** Set by the VS Code extension from `spfxLocalWorkbench.proxy.enabled`. Defaults to `true`. */
  PROXY_ENABLED: `${PARAM_KEY}ProxyEnabled`,
  /** Set by the VS Code extension from `spfxLocalWorkbench.proxy.fallbackStatus`. Defaults to `404`. */
  PROXY_FALLBACK_STATUS: `${PARAM_KEY}ProxyFallbackStatus`,
  /** Set by the VS Code extension from `spfxLocalWorkbench.proxy.mode`. Defaults to `'mock'`. */
  PROXY_MODE: `${PARAM_KEY}ProxyMode`,
  /** Session-local active proxy scenario. Null or undefined represents Base rules. */
  PROXY_SCENARIO: `${PARAM_KEY}ProxyScenario`,
  /**
   * HTML Field Security configuration. Controls which external domains web parts may iframe.
   * Mirrors SharePoint's built-in HTML Field Security setting.
   * Set by the VS Code extension from `spfxLocalWorkbench.htmlFieldSecurity.*`.
   * Falls back to `allowList` with SharePoint's default domain list when running outside the extension.
   */
  HTML_FIELD_SECURITY: `${PARAM_KEY}HtmlFieldSecurity`,
} as const;
