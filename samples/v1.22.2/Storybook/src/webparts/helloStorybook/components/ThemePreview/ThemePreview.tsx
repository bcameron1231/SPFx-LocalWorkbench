import * as React from 'react';
import styles from './ThemePreview.module.scss';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

export interface IThemePreviewProps {
  theme?: IReadonlyTheme;
}

interface ISwatchDef {
  label: string;
  color?: string;
}

export const ThemePreview: React.FC<IThemePreviewProps> = ({ theme }) => {
  const swatches: ISwatchDef[] = [
    { label: 'Primary', color: theme?.palette?.themePrimary },
    { label: 'Secondary', color: theme?.palette?.themeSecondary },
    { label: 'Tertiary', color: theme?.palette?.themeTertiary },
    { label: 'Light', color: theme?.palette?.themeLight },
    { label: 'Lighter', color: theme?.palette?.themeLighter },
    { label: 'LighterA', color: theme?.palette?.themeLighterAlt },
    { label: 'Dark', color: theme?.palette?.themeDark },
    { label: 'DarkA', color: theme?.palette?.themeDarkAlt },
    { label: 'Darker', color: theme?.palette?.themeDarker },
    { label: 'nPrimary', color: theme?.palette?.neutralPrimary },
    { label: 'nPrimaryA', color: theme?.palette?.neutralPrimaryAlt },
    { label: 'nSecondary', color: theme?.palette?.neutralSecondary },
    { label: 'nSecondaryA', color: theme?.palette?.neutralSecondaryAlt },
    { label: 'nTertiary', color: theme?.palette?.neutralTertiary },
    { label: 'nTertiaryA', color: theme?.palette?.neutralTertiaryAlt },
    { label: 'nLight', color: theme?.palette?.neutralLight },
    { label: 'nLighter', color: theme?.palette?.neutralLighter },
    { label: 'nLighterA', color: theme?.palette?.neutralLighterAlt },
    { label: 'nQuaternary', color: theme?.palette?.neutralQuaternary },
    { label: 'nQuaternaryA', color: theme?.palette?.neutralQuaternaryAlt },
    { label: 'nDark', color: theme?.palette?.neutralDark },
  ];

  if (!theme) {
    return <div>No theme information available.</div>;
  }

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
            <span className={styles.swatchLabel} style={{ color: theme?.semanticColors?.bodyText }}>{label}</span>
            <span className={styles.swatchHex} style={{ color: theme?.semanticColors?.bodyText }}>{color}</span>
          </div>
        ))}
      </div>
      <div
        className={styles.textSample}
        style={{ backgroundColor: theme?.semanticColors?.bodyBackground, color: theme?.semanticColors?.bodyText }}
      >
        <div>The quick brown fox jumps over the lazy dog — sample text in body text color on body background.</div>
      </div>
    </div>
  );
};
