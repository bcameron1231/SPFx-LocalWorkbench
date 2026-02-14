/**
 * Storybook preview configuration for SPFx addon
 * This file is loaded in the preview iframe and provides decorators
 */

export { withSpfx } from './decorators/withSpfx';

export const decorators = [];

export const parameters = {
  spfx: {
    // Default SPFx parameters
    serveUrl: 'https://localhost:4321',
    displayMode: 2, // Edit mode by default
    locale: 'en-US',
    showPropertyPane: false,
  },
};
