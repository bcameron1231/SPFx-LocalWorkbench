/**
 * Storybook preview configuration for SPFx addon
 * This file is loaded in the preview iframe and provides decorators
 */
import { DEFAULT_THEME_NAME } from '@spfx-local-workbench/shared';

import { DisplayMode, STORYBOOK_GLOBAL_KEYS } from './constants';
import { withSpfx } from './decorators/withSpfx';
// Global preview-frame styles — makes the canvas body background react to the
// SPFx palette CSS vars that withSpfx sets on document.body on every theme change.
import './preview.css';

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
