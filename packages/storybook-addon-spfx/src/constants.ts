/**
 * Constants for the SPFx Storybook addon
 */

export const ADDON_ID = 'spfx-addon';
export const PANEL_ID = `${ADDON_ID}/property-pane`;
export const BREAKOUT_PANEL_ID = `${ADDON_ID}/breakout`;

export const PARAM_KEY = 'spfx';

export const TOOLBAR_IDS = {
  DISPLAY_MODE: `${ADDON_ID}/display-mode`,
  THEME: `${ADDON_ID}/theme`,
  LOCALE: `${ADDON_ID}/locale`,
} as const;

export enum DisplayMode {
  Read = 1,
  Edit = 2,
}

export const EVENTS = {
  UPDATE_PROPERTIES: `${ADDON_ID}/update-properties`,
  PROPERTY_CHANGED: `${ADDON_ID}/property-changed`,
  DISPLAY_MODE_CHANGED: `${ADDON_ID}/display-mode-changed`,
  THEME_CHANGED: `${ADDON_ID}/theme-changed`,
  LOCALE_CHANGED: `${ADDON_ID}/locale-changed`,
} as const;
