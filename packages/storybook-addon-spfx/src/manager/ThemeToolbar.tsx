/**
 * Theme selector toolbar control
 * Allows switching between different SharePoint themes
 */
import { IconButton, TooltipLinkList, WithTooltip } from '@storybook/components';
import { useGlobals } from '@storybook/manager-api';
import React, { useState } from 'react';

import { MICROSOFT_THEMES } from '@spfx-local-workbench/shared';

import { EVENTS, TOOLBAR_IDS } from '../constants';
import styles from './ThemeToolbar.module.css';

export const ThemeToolbar: React.FC = () => {
  const [globals, updateGlobals] = useGlobals();
  const currentThemeId = globals.spfxThemeId || 'teal';

  const currentTheme = MICROSOFT_THEMES.find((t) => t.id === currentThemeId) || MICROSOFT_THEMES[0];

  const handleThemeChange = (themeId: string) => {
    updateGlobals({ spfxThemeId: themeId });

    // Emit event for the preview
    const channel = (window as any).__STORYBOOK_ADDONS_CHANNEL__;
    if (channel) {
      channel.emit(EVENTS.THEME_CHANGED, themeId);
    }
  };

  const links = MICROSOFT_THEMES.map((theme) => ({
    id: theme.id,
    title: theme.name,
    active: theme.id === currentThemeId,
    onClick: () => handleThemeChange(theme.id),
    left: (
      <div
        className={styles.themeSwatch}
        style={
          {
            '--theme-primary': theme.palette.themePrimary,
          } as React.CSSProperties
        }
      />
    ),
  }));

  return (
    <WithTooltip
      placement="top"
      trigger="click"
      closeOnOutsideClick
      tooltip={<TooltipLinkList links={links} />}
    >
      <IconButton key={TOOLBAR_IDS.THEME} title="Select Theme">
        🎨 <span className={styles.themeLabel}>{currentTheme.name}</span>
      </IconButton>
    </WithTooltip>
  );
};
