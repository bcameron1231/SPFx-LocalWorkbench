/**
 * Display Mode toolbar control
 * Allows switching between Edit and Read display modes
 */
import { IconButton } from '@storybook/components';
import { useGlobals } from '@storybook/manager-api';
import React from 'react';

import { DisplayMode, EVENTS, TOOLBAR_IDS } from '../constants';
import styles from './DisplayModeToolbar.module.css';

export const DisplayModeToolbar: React.FC = () => {
  const [globals, updateGlobals] = useGlobals();
  const displayMode = globals.spfxDisplayMode || DisplayMode.Edit;

  const toggleDisplayMode = () => {
    const newMode = displayMode === DisplayMode.Edit ? DisplayMode.Read : DisplayMode.Edit;
    updateGlobals({ spfxDisplayMode: newMode });

    // Emit event for the preview
    const channel = (window as any).__STORYBOOK_ADDONS_CHANNEL__;
    if (channel) {
      channel.emit(EVENTS.DISPLAY_MODE_CHANGED, newMode);
    }
  };

  return (
    <IconButton
      key={TOOLBAR_IDS.DISPLAY_MODE}
      title={`Display Mode: ${displayMode === DisplayMode.Edit ? 'Edit' : 'Read'}`}
      onClick={toggleDisplayMode}
    >
      {displayMode === DisplayMode.Edit ? '✏️' : '👁️'}
      <span className={styles.modeLabel}>{displayMode === DisplayMode.Edit ? 'Edit' : 'Read'}</span>
    </IconButton>
  );
};
