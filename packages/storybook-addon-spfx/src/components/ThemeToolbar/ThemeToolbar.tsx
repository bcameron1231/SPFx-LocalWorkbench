/**
 * Theme selector toolbar control
 * Allows switching between different SharePoint themes
 */
import { IconButton, WithTooltip } from '@storybook/components';
import { StarIcon } from '@storybook/icons';
import { useGlobals, useParameter } from '@storybook/manager-api';
import React, { useState } from 'react';

import {
  DEFAULT_THEME_NAME,
  ThemePickerDropdown,
  buildThemeList,
} from '@spfx-local-workbench/shared';
import type { ITheme, IThemeGroup } from '@spfx-local-workbench/shared';

import { PARAM_KEY, STORYBOOK_GLOBAL_KEYS } from '../../constants';
import type { ISpfxParameters } from '../../types';

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
  const groups: IThemeGroup[] = [
    { label: 'This story', themes: storyThemes },
    { label: 'From your organization', themes: globalCustomThemes },
    { label: 'From Microsoft', themes: microsoftThemes },
  ];

  const tooltip = (
    <ThemePickerDropdown
      groups={groups}
      currentThemeName={currentThemeName}
      onSelect={handleThemeChange}
    />
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
      <IconButton title={`Theme: ${currentTheme?.name ?? DEFAULT_THEME_NAME}`}>
        <StarIcon style={{ color: currentTheme?.palette.themePrimary }} />
      </IconButton>
    </WithTooltip>
  );
};
