/**
 * Storybook manager configuration for SPFx addon
 * This file is loaded in the Storybook manager and registers toolbar controls.
 */
import { addons, types } from '@storybook/manager-api';
import React from 'react';

import {
  DisplayModeToolbar,
  PropertyPaneToolbar,
  ScenarioToolbar,
  ThemeToolbar,
} from './components';
import { ADDON_ID, TOOLBAR_IDS } from './constants';

// Register the addon
addons.register(ADDON_ID, () => {
  // Register display mode toolbar
  addons.add(TOOLBAR_IDS.DISPLAY_MODE, {
    type: types.TOOL,
    title: 'Display Mode',
    match: ({ viewMode }) => viewMode === 'story',
    render: () => <DisplayModeToolbar />,
  });

  addons.add(TOOLBAR_IDS.PROPERTY_PANE, {
    type: types.TOOL,
    title: 'Edit properties',
    match: ({ viewMode }) => viewMode === 'story',
    render: () => <PropertyPaneToolbar />,
  });

  // Register theme toolbar
  addons.add(TOOLBAR_IDS.THEME, {
    type: types.TOOL,
    title: 'Theme',
    match: ({ viewMode }) => viewMode === 'story',
    render: () => <ThemeToolbar />,
  });

  addons.add(TOOLBAR_IDS.SCENARIO, {
    type: types.TOOL,
    title: 'Proxy Scenario',
    match: ({ viewMode }) => viewMode === 'story',
    render: () => <ScenarioToolbar />,
  });

  // // Register locale toolbar
  // addons.add(TOOLBAR_IDS.LOCALE, {
  //   type: types.TOOL,
  //   title: 'Locale',
  //   match: ({ viewMode }) => viewMode === 'story',
  //   render: () => <LocaleToolbar />,
  // });
});
