/**
 * Storybook theme color values matching ThemeVarsColors from `@storybook/theming`.
 * Each field is populated from the corresponding --vscode-* CSS custom property
 * read out of the VS Code webview DOM at startup.
 */
export interface IStorybookThemeColors {
  /** 'light' or 'dark' — derived from document.body class */
  base: 'light' | 'dark';
  // Accent
  colorPrimary: string;
  colorSecondary: string;
  // App chrome
  appBg: string;
  appContentBg: string;
  appBorderColor: string;
  // Typography (fontBase is hardcoded in manager.ts; fontCode comes from the editor)
  fontCode: string;
  // Text
  textColor: string;
  textInverseColor: string;
  textMutedColor: string;
  // Toolbar
  barTextColor: string;
  barHoverColor: string;
  barSelectedColor: string;
  barBg: string;
  // Buttons
  buttonBg: string;
  buttonBorder: string;
  // Boolean / toggle controls
  booleanBg: string;
  booleanSelectedBg: string;
  // Form inputs
  inputBg: string;
  inputBorder: string;
  inputTextColor: string;
}
