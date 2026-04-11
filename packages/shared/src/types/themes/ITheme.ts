import type { IThemePalette } from './IThemePalette';

/**
 * SharePoint theme definition
 */
interface ISharePointTheme {
  name: string;
  isInverted: boolean;
  backgroundImageUri: string;
  palette: IThemePalette;
}

export interface ITheme extends ISharePointTheme {
  isCustom: boolean;
}
