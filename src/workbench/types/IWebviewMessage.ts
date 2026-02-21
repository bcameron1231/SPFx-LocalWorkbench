import type { IStorybookThemeColors } from './IStorybookThemeColors';

/** Message from webview to extension */
export interface IWebviewMessage {
  command: 'refresh' | 'setServeUrl' | 'openDevTools' | 'log' | 'error' | 'vscodeThemeColors';
  url?: string;
  text?: string;
  colors?: IStorybookThemeColors;
}
