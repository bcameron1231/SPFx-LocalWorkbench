import { DisplayMode } from '@microsoft/sp-core-library';
import type { IThemeColors } from './IThemeColors';

export interface IHelloStorybookProps {
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  themeColors: IThemeColors;
  displayMode: DisplayMode;
  textValue: string;
  sliderValue: number;
  toggleValue: boolean;
  internalValue: object;
}
