import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { DisplayMode } from '@microsoft/sp-core-library';

export interface IHelloStorybookProps {
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  theme?: IReadonlyTheme;
  displayMode: DisplayMode;
  textValue: string;
  sliderValue: number;
  toggleValue: boolean;
  internalValue: object;
}
