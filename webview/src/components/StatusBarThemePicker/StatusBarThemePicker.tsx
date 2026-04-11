/**
 * StatusBarThemePicker Component
 *
 * A theme switcher for the status bar that mirrors the storybook ThemeToolbar.
 * Mounted as a separate React root on the static status bar element.
 */
import { IconButton } from '@fluentui/react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import { ThemePickerDropdown, buildThemeList } from '@spfx-local-workbench/shared';
import type { ITheme, IThemeGroup } from '@spfx-local-workbench/shared';

import styles from './StatusBarThemePicker.module.css';

export interface IStatusBarThemePickerProps {
  /** The currently active theme when the component mounts */
  initialTheme: ITheme;
  /** Grouped themes to display in the picker */
  groups: IThemeGroup[];
}

/**
 * Renders a small Color icon button in the status bar.
 * Clicking it opens a popup with the full ThemePickerDropdown above the button.
 * Dispatches `workbenchThemeChanged` CustomEvent when a theme is selected.
 * Listens for `workbenchSettingsThemeUpdated` to stay in sync when VS Code
 * settings push a new theme.
 */
export const StatusBarThemePicker: React.FC<IStatusBarThemePickerProps> = ({
  initialTheme,
  groups: initialGroups,
}) => {
  const [currentTheme, setCurrentTheme] = useState<ITheme>(initialTheme);
  const [groups, setGroups] = useState<IThemeGroup[]>(initialGroups);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the popup when the user clicks outside the container
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // Sync with VS Code settings changes pushed from WorkbenchRuntime
  useEffect(() => {
    const handler = (e: Event) => {
      const theme = (e as CustomEvent<ITheme>).detail;
      if (theme) setCurrentTheme(theme);
    };
    window.addEventListener('workbenchSettingsThemeUpdated', handler);
    return () => window.removeEventListener('workbenchSettingsThemeUpdated', handler);
  }, []);

  // Rebuild groups when custom themes change in VS Code settings
  useEffect(() => {
    const handler = (e: Event) => {
      const customThemes = (e as CustomEvent<ITheme[]>).detail;
      const microsoftThemes = buildThemeList();
      setGroups([
        ...(customThemes.length ? [{ label: 'From your organization', themes: customThemes }] : []),
        { label: 'From Microsoft', themes: microsoftThemes },
      ]);
    };
    window.addEventListener('workbenchSettingsCustomThemesUpdated', handler);
    return () => window.removeEventListener('workbenchSettingsCustomThemesUpdated', handler);
  }, []);

  const handleSelect = (themeName: string) => {
    const theme = groups.flatMap((g) => g.themes).find((t) => t.name === themeName);
    if (!theme) return;
    setCurrentTheme(theme);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('workbenchThemeChanged', { detail: theme }));
  };

  return (
    <div ref={containerRef} className={styles.container}>
      {isOpen && (
        <div className={styles.popup}>
          <ThemePickerDropdown
            groups={groups}
            currentThemeName={currentTheme.name}
            onSelect={handleSelect}
          />
        </div>
      )}
      <IconButton
        iconProps={{ iconName: 'Color' }}
        title={`Theme: ${currentTheme.name}`}
        ariaLabel={`Theme: ${currentTheme.name}`}
        onClick={() => setIsOpen((v) => !v)}
        styles={{
          root: { height: 20, width: 'auto', padding: '0 4px', color: 'inherit' },
          icon: { color: currentTheme.palette.themePrimary, fontSize: 12 },
        }}
      />
    </div>
  );
};
