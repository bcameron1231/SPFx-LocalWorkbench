/**
 * ThemePickerDropdown Component
 *
 * Renders a grouped list of themes using ThemePreview items.
 * Shared between the Storybook ThemeToolbar and the workbench StatusBarThemePicker.
 * No framework-specific dependencies — pure React.
 */
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  /** Visual treatment for the dropdown. Defaults to the M365 styling. */
  variant?: 'm365' | 'vscode';
  /** Accessible label for the picker */
  ariaLabel?: string;
  /** Autofocus the current selection when the picker mounts */
  autoFocusSelected?: boolean;
  /** Called when the user dismisses the picker via keyboard */
  onEscape?: () => void;
}

/**
 * Renders a grouped, scrollable list of themes.
 * Each entry in `groups` is rendered as a labelled section (when non-empty).
 */
export const ThemePickerDropdown: React.FC<IThemePickerDropdownProps> = ({
  groups,
  currentThemeName,
  onSelect,
  variant = 'm365',
  ariaLabel = 'Theme picker',
  autoFocusSelected = false,
  onEscape,
}) => {
  const themeOptions = useMemo(() => groups.flatMap((group) => group.themes), [groups]);
  const [focusedThemeName, setFocusedThemeName] = useState(currentThemeName);
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setFocusedThemeName(currentThemeName);
  }, [currentThemeName]);

  useEffect(() => {
    if (!autoFocusSelected || themeOptions.length === 0) {
      return;
    }

    const targetThemeName = themeOptions.some((theme) => theme.name === currentThemeName)
      ? currentThemeName
      : themeOptions[0].name;

    setFocusedThemeName(targetThemeName);
    optionRefs.current[targetThemeName]?.focus();
  }, [autoFocusSelected, currentThemeName, themeOptions]);

  const focusThemeByIndex = (index: number): void => {
    const wrappedIndex = (index + themeOptions.length) % themeOptions.length;
    const themeName = themeOptions[wrappedIndex]?.name;
    if (!themeName) {
      return;
    }

    setFocusedThemeName(themeName);
    optionRefs.current[themeName]?.focus();
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    themeName: string,
    optionIndex: number,
  ): void => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        focusThemeByIndex(optionIndex + 1);
        return;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        focusThemeByIndex(optionIndex - 1);
        return;
      case 'Home':
        e.preventDefault();
        focusThemeByIndex(0);
        return;
      case 'End':
        e.preventDefault();
        focusThemeByIndex(themeOptions.length - 1);
        return;
      case ' ':
      case 'Enter':
        e.preventDefault();
        onSelect(themeName);
        return;
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        return;
      default:
        return;
    }
  };

  return (
    <div
      className={`${styles.themeDropdown} ${
        variant === 'vscode' ? styles.themeDropdownVscode : styles.themeDropdownM365
      }`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {groups.map(
        ({ label, themes }) =>
          themes.length > 0 && (
            <React.Fragment key={label}>
              <div
                className={`${styles.themeGroupHeader} ${
                  variant === 'vscode'
                    ? styles.themeGroupHeaderVscode
                    : styles.themeGroupHeaderM365
                }`}
              >
                {label}
              </div>
              {themes.map((theme) => {
                const optionIndex = themeOptions.findIndex((option) => option.name === theme.name);
                return (
                  <ThemePreview
                    key={theme.name}
                    id={`theme-option-${optionIndex}`}
                    theme={theme}
                    isSelected={theme.name === currentThemeName}
                    onClick={() => onSelect(theme.name)}
                    onFocus={() => setFocusedThemeName(theme.name)}
                    onKeyDown={(e) => handleOptionKeyDown(e, theme.name, optionIndex)}
                    role="radio"
                    tabIndex={focusedThemeName === theme.name ? 0 : -1}
                    ariaChecked={theme.name === currentThemeName}
                    ariaLabel={`${theme.name} theme`}
                    variant={variant}
                    elementRef={(element) => {
                      optionRefs.current[theme.name] = element;
                    }}
                  />
                );
              })}
            </React.Fragment>
          ),
      )}
    </div>
  );
};
