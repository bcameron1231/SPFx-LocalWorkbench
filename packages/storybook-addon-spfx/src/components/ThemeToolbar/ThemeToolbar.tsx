/**
 * Theme selector toolbar control
 * Allows switching between different SharePoint themes
 */
import { IconButton, WithTooltip } from '@storybook/components';
import { StarIcon } from '@storybook/icons';
import { useGlobals, useParameter } from '@storybook/manager-api';
import React, { useState } from 'react';

import { ThemePreview, buildThemeList, DEFAULT_THEME_NAME } from '@spfx-local-workbench/shared';
import type { ITheme } from '@spfx-local-workbench/shared';

import { PARAM_KEY, STORYBOOK_GLOBAL_KEYS } from '../../constants';
import type { ISpfxParameters } from '../../types';
import styles from './ThemeToolbar.module.css';

export const ThemeToolbar: React.FC = () => {
  const [globals, updateGlobals] = useGlobals();
  const [isOpen, setIsOpen] = useState(false);

  const currentThemeName: string = globals[STORYBOOK_GLOBAL_KEYS.THEME] ?? DEFAULT_THEME_NAME;
  const globalCustomThemes: ITheme[] = globals[STORYBOOK_GLOBAL_KEYS.CUSTOM_THEMES] ?? [];
  const parameters = useParameter<Partial<ISpfxParameters>>(PARAM_KEY, {});
  const storyThemes: ITheme[] = parameters?.customThemes ?? [];

  // Build deduplicated list: story themes > global custom themes > Microsoft themes
  // MICROSOFT_THEMES is appended by buildThemeList — never imported here directly
  const allThemes = buildThemeList(storyThemes, globalCustomThemes);

  const currentTheme = allThemes.find((t) => t.name === currentThemeName) ?? allThemes[0];

  const handleThemeChange = (themeName: string) => {
    updateGlobals({ [STORYBOOK_GLOBAL_KEYS.THEME]: themeName });
    setIsOpen(false);
  };

  const microsoftThemes = allThemes.filter((t) => !t.isCustom);

  const tooltip = (
    <div className={styles.themeDropdown}>
      {storyThemes.length > 0 && (
        <>
          <div className={styles.themeGroupHeader}>This story</div>
          {storyThemes.map((theme) => (
            <ThemePreview
              key={theme.name}
              theme={theme}
              isSelected={theme.name === currentThemeName}
              onClick={() => handleThemeChange(theme.name)}
            />
          ))}
        </>
      )}
      {globalCustomThemes.length > 0 && (
        <>
          <div className={styles.themeGroupHeader}>From your organization</div>
          {globalCustomThemes.map((theme) => (
            <ThemePreview
              key={theme.name}
              theme={theme}
              isSelected={theme.name === currentThemeName}
              onClick={() => handleThemeChange(theme.name)}
            />
          ))}
        </>
      )}
      <div className={styles.themeGroupHeader}>From Microsoft</div>
      {microsoftThemes.map((theme) => (
        <ThemePreview
          key={theme.name}
          theme={theme}
          isSelected={theme.name === currentThemeName}
          onClick={() => handleThemeChange(theme.name)}
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
        title={`Theme: ${currentTheme?.name ?? DEFAULT_THEME_NAME}`}
        className={styles.toolbarIcon}
        style={
          {
            '--themePrimary': currentTheme?.palette.themePrimary,
          } as React.CSSProperties
        }
      >
        <StarIcon />
      </IconButton>
    </WithTooltip>
  );
};

