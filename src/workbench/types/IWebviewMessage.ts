import type { IStorybookThemeColors } from './IStorybookThemeColors';

/** Message from webview to extension */
export interface IWebviewMessage {
  command:
    | 'refresh'
    | 'setServeUrl'
    | 'openDevTools'
    | 'openSettings'
    | 'startServe'
    | 'log'
    | 'error'
    | 'vscodeThemeColors'
    | 'setTheme';
  url?: string;
  text?: string;
  colors?: IStorybookThemeColors;
  /** Theme name — set when command is 'setTheme' */
  themeName?: string;
  /** Whether the theme is a custom (non-Microsoft) theme — set when command is 'setTheme' */
  isCustomTheme?: boolean;
}
