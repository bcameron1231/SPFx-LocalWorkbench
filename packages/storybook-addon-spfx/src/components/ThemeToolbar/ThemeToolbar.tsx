/**
 * Theme selector toolbar control
 * Allows switching between different SharePoint themes
 */
import { IconButton, WithTooltip } from '@storybook/components';
import { StarIcon } from '@storybook/icons';
import { useGlobals } from '@storybook/manager-api';
import React, { useState } from 'react';

import { MICROSOFT_THEMES, ThemePreview } from '@spfx-local-workbench/shared';

import { STORYBOOK_GLOBAL_KEYS } from '../../constants';
import styles from './ThemeToolbar.module.css';

export const ThemeToolbar: React.FC = () => {
  const [globals, updateGlobals] = useGlobals();
  const [isOpen, setIsOpen] = useState(false);
  const currentThemeId = globals[STORYBOOK_GLOBAL_KEYS.THEME] || 'teal';

  const currentTheme = MICROSOFT_THEMES.find((t) => t.id === currentThemeId) || MICROSOFT_THEMES[0];

  const handleThemeChange = (themeId: string) => {
    updateGlobals({ [STORYBOOK_GLOBAL_KEYS.THEME]: themeId });
    console.log(`Theme changed to: ${themeId}`);
    setIsOpen(false);
  };

  const customThemes = MICROSOFT_THEMES.filter((t) => t.isCustom);
  const microsoftThemes = MICROSOFT_THEMES.filter((t) => !t.isCustom);

  const tooltip = (
    <div className={styles.themeDropdown}>
      {customThemes.length > 0 && (
        <>
          <div className={styles.themeGroupHeader}>From your organization</div>
          {customThemes.map((theme) => (
            <ThemePreview
              key={theme.id}
              theme={theme}
              isSelected={theme.id === currentThemeId}
              onClick={() => handleThemeChange(theme.id)}
            />
          ))}
        </>
      )}
      <div className={styles.themeGroupHeader}>From Microsoft</div>
      {microsoftThemes.map((theme) => (
        <ThemePreview
          key={theme.id}
          theme={theme}
          isSelected={theme.id === currentThemeId}
          onClick={() => handleThemeChange(theme.id)}
        />
      ))}
    </div>
  );

  return (
    <WithTooltip
      placement="top"
      trigger="click"
      closeOnOutsideClick
      tooltip={tooltip}
      visible={isOpen}
      onVisibleChange={setIsOpen}
    >
      <IconButton
        title={`Theme: ${currentTheme.name}`}
        className={styles.toolbarIcon}
        style={
          {
            '--themePrimary': currentTheme.palette.themePrimary,
          } as React.CSSProperties
        }
      >
        <StarIcon />
      </IconButton>
    </WithTooltip>
  );
};
