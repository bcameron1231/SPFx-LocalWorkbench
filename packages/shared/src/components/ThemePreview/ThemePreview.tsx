/**
 * ThemePreview Component
 *
 * Displays a compact visual preview of a Fluent UI theme.
 * Matches Microsoft's theme picker design with color swatches and text preview.
 *
 * This component is used in the workbench toolbar and will be reusable in Storybook.
 */
import * as React from 'react';

import type { ITheme } from '../../types';
import styles from './ThemePreview.module.css';

/**
 * Props for ThemePreview component
 */
export interface IThemePreviewProps {
  /** Theme to preview */
  theme: ITheme;
  /** Whether this theme is currently selected */
  isSelected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Visual treatment for the preview. Defaults to the M365 styling. */
  variant?: 'm365' | 'vscode';
  /** Optional element id */
  id?: string;
  /** Accessibility role for the interactive preview */
  role?: React.AriaRole;
  /** Keyboard tab order */
  tabIndex?: number;
  /** Accessible selected state */
  ariaChecked?: boolean;
  /** Accessible label override */
  ariaLabel?: string;
  /** Focus handler */
  onFocus?: React.FocusEventHandler<HTMLDivElement>;
  /** Keydown handler */
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  /** Ref for focus management */
  elementRef?: React.Ref<HTMLDivElement>;
}

const SMALL_SWATCH_WIDTH = 12.5; // each of 4 small swatches is 12.5% wide (4 × 12.5 = 50% right half)

/**
 * ThemePreview component displays a visual representation of a theme
 * using an SVG with a primary color block, 4 smaller color swatches, and text preview
 */
export const ThemePreview: React.FC<IThemePreviewProps> = ({
  theme,
  isSelected = false,
  onClick,
  variant = 'm365',
  id,
  role,
  tabIndex,
  ariaChecked,
  ariaLabel,
  onFocus,
  onKeyDown,
  elementRef,
}) => {
  const { palette } = theme;
  const smallSwatches = [
    palette.themeSecondary,
    palette.themeTertiary,
    palette.themeLight,
    palette.accent ?? palette.themePrimary,
  ];

  return (
    <div
      ref={elementRef}
      id={id}
      className={`${styles.container} ${onClick ? styles.clickable : ''} ${
        variant === 'vscode' ? styles.containerVscode : styles.containerM365
      }`}
      style={{ borderColor: isSelected ? palette.themePrimary : undefined }}
      onClick={onClick}
      role={role ?? (onClick ? 'button' : undefined)}
      tabIndex={tabIndex ?? (onClick ? 0 : undefined)}
      aria-label={ariaLabel ?? `${theme.name} theme${isSelected ? ' (selected)' : ''}`}
      aria-checked={ariaChecked}
      aria-pressed={role ? undefined : onClick ? isSelected : undefined}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      <svg
        role="presentation"
        className={styles.svgIcon}
        viewBox="0 0 84 46"
        aria-hidden="true"
        style={{ borderColor: palette.neutralLight }}
      >
        {/* Background */}
        <rect
          height="100%"
          width="100%"
          fill={palette.primaryBackground ?? palette.white}
          stroke="none"
        />
        {/* Large primary swatch — top-left 50% */}
        <rect y="0%" height="50%" width="50%" fill={palette.themePrimary} stroke="none" />
        {/* Small swatches — top-right 50% */}
        {smallSwatches.map((color, i) => (
          <rect
            key={i}
            y="0%"
            height="50%"
            width={`${SMALL_SWATCH_WIDTH}%`}
            fill={color}
            stroke="none"
            x={`${50 + i * SMALL_SWATCH_WIDTH}%`}
          />
        ))}
        {/* Text preview in lower-left */}
        <text x="10%" y="84%" fill={palette.bodyText ?? palette.neutralPrimary} role="presentation">
          Abc
        </text>
      </svg>

      {/* Theme name label */}
      <div
        className={`${styles.label} ${
          variant === 'vscode' ? styles.labelVscode : styles.labelM365
        } ${isSelected ? styles.labelSelected : ''}`}
        style={{
          color:
            variant === 'vscode' && isSelected
              ? 'var(--vscode-menu-selectionForeground, inherit)'
              : 'inherit',
        }}
      >
        {theme.name}
      </div>
    </div>
  );
};
