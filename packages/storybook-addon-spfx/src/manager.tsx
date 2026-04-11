/**
 * Storybook manager configuration for SPFx addon
 * This file is loaded in the Storybook manager and registers toolbar controls and panels
 */
import { addons, types } from '@storybook/manager-api';
import React from 'react';

import { DisplayModeToolbar, PropertyPanePanel, ThemeToolbar } from './components';
import { ADDON_ID, PANEL_ID, TOOLBAR_IDS } from './constants';

// Register the addon
addons.register(ADDON_ID, () => {
  // Register display mode toolbar
  addons.add(TOOLBAR_IDS.DISPLAY_MODE, {
    type: types.TOOL,
    title: 'Display Mode',
    match: ({ viewMode }) => viewMode === 'story',
    render: () => <DisplayModeToolbar />,
  });

  // Register theme toolbar
  addons.add(TOOLBAR_IDS.THEME, {
    type: types.TOOL,
    title: 'Theme',
    match: ({ viewMode }) => viewMode === 'story',
    render: () => <ThemeToolbar />,
  });

  // // Register locale toolbar
  // addons.add(TOOLBAR_IDS.LOCALE, {
  //   type: types.TOOL,
  //   title: 'Locale',
  //   match: ({ viewMode }) => viewMode === 'story',
  //   render: () => <LocaleToolbar />,
  // });

  // Register property pane panel
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Property Pane',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => <PropertyPanePanel active={!!active} />,
  });
});
