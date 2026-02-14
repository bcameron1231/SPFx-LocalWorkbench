import type { IThemePalette } from './IThemePalette';

/**
 * SharePoint theme definition
 */
export interface ITheme {
    id: string;
    name: string;
    isCustom: boolean;
    palette: IThemePalette;
}
