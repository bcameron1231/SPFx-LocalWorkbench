/**
 * Storybook preview configuration for SPFx addon
 * This file is loaded in the preview iframe and provides decorators
 */
import { DisplayMode, STORYBOOK_GLOBAL_KEYS } from './constants';
import { withSpfx } from './decorators/withSpfx';

export const decorators = [withSpfx];

export const globalTypes = {
  [STORYBOOK_GLOBAL_KEYS.DISPLAY_MODE]: {
    defaultValue: DisplayMode.Edit,
  },
  [STORYBOOK_GLOBAL_KEYS.THEME]: {
    defaultValue: 'teal',
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
