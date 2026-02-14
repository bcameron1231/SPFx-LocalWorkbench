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
}

/**
 * ThemePreview component displays a visual representation of a theme
 * with a large primary color block, 4 smaller color swatches, and text preview
 */
export const ThemePreview: React.FC<IThemePreviewProps> = ({
    theme,
    isSelected = false,
    onClick
}) => {
    const { palette } = theme;

    return (
        <div
            className={`${styles.container} ${isSelected ? styles.selected : ''} ${onClick ? styles.clickable : ''}`}
            style={{
                borderColor: isSelected ? palette.themePrimary : 'transparent',
                backgroundColor: isSelected ? palette.neutralLighter : 'transparent'
            }}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={`${theme.name} theme${isSelected ? ' (selected)' : ''}`}
            aria-pressed={isSelected}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className={styles.previewBlock}>
                {/* Large primary color swatch */}
                <div 
                    className={styles.largeSwatch}
                    style={{ backgroundColor: palette.themePrimary }}
                    title={`Primary: ${palette.themePrimary}`}
                />
                
                {/* Four small color swatches */}
                <div className={styles.smallSwatchContainer}>
                    <div 
                        className={styles.smallSwatch}
                        style={{ backgroundColor: palette.themeSecondary }}
                        title={`Secondary: ${palette.themeSecondary}`}
                    />
                    <div 
                        className={styles.smallSwatch}
                        style={{ backgroundColor: palette.themeDark }}
                        title={`Dark: ${palette.themeDark}`}
                    />
                    <div 
                        className={styles.smallSwatch}
                        style={{ backgroundColor: palette.neutralPrimary }}
                        title={`Neutral Primary: ${palette.neutralPrimary}`}
                    />
                    <div 
                        className={styles.smallSwatch}
                        style={{ backgroundColor: palette.neutralSecondary }}
                        title={`Neutral Secondary: ${palette.neutralSecondary}`}
                    />
                </div>

                {/* Text preview */}
                <div 
                    className={styles.textPreview}
                    style={{
                        backgroundColor: palette.neutralLighter,
                        color: palette.neutralPrimary
                    }}
                >
                    Abc
                </div>
            </div>

            {/* Theme name label */}
            <div 
                className={`${styles.label} ${isSelected ? styles.labelSelected : ''}`}
                style={{ color: palette.neutralPrimary }}
            >
                {theme.name}
            </div>
        </div>
    );
};
