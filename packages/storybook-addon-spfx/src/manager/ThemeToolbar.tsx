/**
 * Theme selector toolbar control
 * Allows switching between different SharePoint themes
 */

import React, { useState } from 'react';
import { useGlobals } from '@storybook/manager-api';
import { IconButton, WithTooltip, TooltipLinkList } from '@storybook/components';
import { TOOLBAR_IDS, EVENTS } from '../constants';
import { MICROSOFT_THEMES } from '@spfx-local-workbench/shared';

export const ThemeToolbar: React.FC = () => {
  const [globals, updateGlobals] = useGlobals();
  const currentThemeId = globals.spfxThemeId || 'teal';
  
  const currentTheme = MICROSOFT_THEMES.find(t => t.id === currentThemeId) || MICROSOFT_THEMES[0];

  const handleThemeChange = (themeId: string) => {
    updateGlobals({ spfxThemeId: themeId });
    
    // Emit event for the preview
    const channel = (window as any).__STORYBOOK_ADDONS_CHANNEL__;
    if (channel) {
      channel.emit(EVENTS.THEME_CHANGED, themeId);
    }
  };

  const links = MICROSOFT_THEMES.map(theme => ({
    id: theme.id,
    title: theme.name,
    active: theme.id === currentThemeId,
    onClick: () => handleThemeChange(theme.id),
    left: (
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '2px',
          backgroundColor: theme.palette.themePrimary,
          border: '1px solid #e1e1e1',
        }}
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
        🎨 <span style={{ marginLeft: '4px', fontSize: '12px' }}>{currentTheme.name}</span>
      </IconButton>
    </WithTooltip>
  );
};
