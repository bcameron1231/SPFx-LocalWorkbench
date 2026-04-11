/**
 * Fluent UI theme palette interface
 * Defines color tokens for SharePoint themes
 */
export interface IThemePalette {
  // Theme colors
  themeDarker: string;
  themeDark: string;
  themeDarkAlt: string;
  themePrimary: string;
  themeSecondary: string;
  themeTertiary: string;
  themeLight: string;
  themeLighter: string;
  themeLighterAlt: string;

  // Neutral colors
  black: string;
  neutralDark: string;
  neutralPrimary: string;
  neutralPrimaryAlt: string;
  neutralSecondary: string;
  neutralTertiary: string;
  neutralTertiaryAlt: string;
  neutralLight: string;
  neutralLighter: string;
  neutralLighterAlt: string;
  white: string;
  neutralQuaternaryAlt: string;
  neutralQuaternary: string;
  neutralSecondaryAlt: string;

  // Specific slots
  primaryBackground: string;
  primaryText: string;
  accent: string;

  // Optional additional slots
  [key: string]: string; // bodyBackground, bodyText, disabledBackground, disabledText, error, etc.
}
