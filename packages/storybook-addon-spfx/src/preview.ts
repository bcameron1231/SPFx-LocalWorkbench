/**
 * Storybook preview configuration for SPFx addon
 * This file is loaded in the preview iframe and provides decorators
 */
import { DisplayMode, STORYBOOK_GLOBAL_KEYS } from './constants';
import { DEFAULT_THEME_NAME } from '@spfx-local-workbench/shared';
import { withSpfx } from './decorators/withSpfx';

export const decorators = [withSpfx];

export const globalTypes = {
  [STORYBOOK_GLOBAL_KEYS.DISPLAY_MODE]: {
    defaultValue: DisplayMode.Edit,
  },
  [STORYBOOK_GLOBAL_KEYS.THEME]: {
    defaultValue: DEFAULT_THEME_NAME,
  },
};

export const parameters = {
  spfx: {
    // Default SPFx parameters
    serveUrl: 'https://localhost:4321',
    displayMode: 2, // Edit mode by default
    locale: 'en-US',
    showPropertyPane: false,
  },
};
