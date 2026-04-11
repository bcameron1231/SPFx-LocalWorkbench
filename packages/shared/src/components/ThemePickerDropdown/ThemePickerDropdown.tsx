/**
 * ThemePickerDropdown Component
 *
 * Renders a grouped list of themes using ThemePreview items.
 * Shared between the Storybook ThemeToolbar and the workbench StatusBarThemePicker.
 * No framework-specific dependencies — pure React.
 */
import * as React from 'react';

import type { ITheme } from '../../types';
import { ThemePreview } from '../ThemePreview';
import styles from './ThemePickerDropdown.module.css';

/** A labelled group of themes to display in the picker */
export interface IThemeGroup {
  label: string;
  themes: ITheme[];
}

export interface IThemePickerDropdownProps {
  /** Ordered list of theme groups to render; empty groups are omitted */
  groups: IThemeGroup[];
  /** Currently selected theme name */
  currentThemeName: string;
  /** Called when the user selects a theme */
  onSelect: (themeName: string) => void;
}

/**
 * Renders a grouped, scrollable list of themes.
 * Each entry in `groups` is rendered as a labelled section (when non-empty).
 */
export const ThemePickerDropdown: React.FC<IThemePickerDropdownProps> = ({
  groups,
  currentThemeName,
  onSelect,
}) => (
  <div className={styles.themeDropdown}>
    {groups.map(
      ({ label, themes }) =>
        themes.length > 0 && (
          <React.Fragment key={label}>
            <div className={styles.themeGroupHeader}>{label}</div>
            {themes.map((theme) => (
              <ThemePreview
                key={theme.name}
                theme={theme}
                isSelected={theme.name === currentThemeName}
                onClick={() => onSelect(theme.name)}
              />
            ))}
          </React.Fragment>
        ),
    )}
  </div>
);
