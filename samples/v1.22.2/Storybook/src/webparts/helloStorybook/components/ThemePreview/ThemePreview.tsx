import * as React from 'react';
import type { IThemeColors } from '../IThemeColors';
import styles from './ThemePreview.module.scss';

export interface IThemePreviewProps {
  themeColors: IThemeColors;
}

interface ISwatchDef {
  label: string;
  color: string;
}

export const ThemePreview: React.FC<IThemePreviewProps> = ({ themeColors }) => {
  const swatches: ISwatchDef[] = [
    { label: 'Primary', color: themeColors.primary },
    { label: 'Secondary', color: themeColors.secondary },
    { label: 'Tertiary', color: themeColors.tertiary },
    { label: 'Light', color: themeColors.light },
    { label: 'Dark', color: themeColors.dark },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.swatchRow}>
        {swatches.map(({ label, color }) => (
          <div key={label} className={styles.swatchWrapper}>
            <div
              className={styles.swatchBlock}
              style={{ backgroundColor: color }}
              title={color}
            />
            <span className={styles.swatchLabel} style={{ color: themeColors.bodyText }}>{label}</span>
            <span className={styles.swatchHex} style={{ color: themeColors.bodyText }}>{color}</span>
          </div>
        ))}
      </div>
      <div
        className={styles.textSample}
        style={{ backgroundColor: themeColors.bodyBackground, color: themeColors.bodyText }}
      >
        The quick brown fox jumps over the lazy dog — sample text in body text color on body background.
      </div>
    </div>
  );
};
