import type { IThemeSettings } from '../types';

// Resolved colors for each preset
interface IResolvedColors {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
}

const presetColors: Record<string, IResolvedColors> = {
    teamSite: { primaryColor: '#0078d4', backgroundColor: '#ffffff', textColor: '#323130' },
    communicationSite: { primaryColor: '#038387', backgroundColor: '#ffffff', textColor: '#323130' },
    dark: { primaryColor: '#2899f5', backgroundColor: '#1b1a19', textColor: '#faf9f8' },
    highContrast: { primaryColor: '#1aebff', backgroundColor: '#000000', textColor: '#ffffff' },
};

function resolveThemeColors(settings?: IThemeSettings): IResolvedColors {
    const preset = settings?.preset || 'teamSite';

    if (preset === 'custom' && settings?.customColors) {
        return {
            primaryColor: settings.customColors['themePrimary'] || settings.primaryColor || '#0078d4',
            backgroundColor: settings.customColors['white'] || settings.backgroundColor || '#ffffff',
            textColor: settings.customColors['neutralPrimary'] || settings.textColor || '#323130',
        };
    }

    const base = presetColors[preset] || presetColors['teamSite'];
    return {
        primaryColor: settings?.primaryColor || base.primaryColor,
        backgroundColor: settings?.backgroundColor || base.backgroundColor,
        textColor: settings?.textColor || base.textColor,
    };
}

export class ThemeProvider {
    private resolvedColors: IResolvedColors;
    public sharePointTheme: any;

    constructor(themeSettings?: IThemeSettings) {
        this.resolvedColors = resolveThemeColors(themeSettings);
        this.sharePointTheme = this.createSharePointTheme();
    }

    private createSharePointTheme(): any {
        const isInverted = this.resolvedColors.backgroundColor !== '#ffffff';
        return {
            palette: {
                themePrimary: this.resolvedColors.primaryColor,
                themeLighterAlt: '#eff6fc',
                themeLighter: '#deecf9',
                themeLight: '#c7e0f4',
                themeTertiary: '#71afe5',
                themeSecondary: '#2b88d8',
                themeDarkAlt: '#106ebe',
                themeDark: '#005a9e',
                themeDarker: '#004578',
                neutralLighterAlt: '#faf9f8',
                neutralLighter: '#f3f2f1',
                neutralLight: '#edebe9',
                neutralQuaternaryAlt: '#e1dfdd',
                neutralQuaternary: '#d0d0d0',
                neutralTertiaryAlt: '#c8c6c4',
                neutralTertiary: '#a19f9d',
                neutralSecondary: '#605e5c',
                neutralPrimaryAlt: '#3b3a39',
                neutralPrimary: this.resolvedColors.textColor || '#323130',
                neutralDark: '#201f1e',
                black: '#000000',
                white: this.resolvedColors.backgroundColor || '#ffffff'
            },
            semanticColors: {
                bodyBackground: this.resolvedColors.backgroundColor || '#ffffff',
                bodyText: this.resolvedColors.textColor || '#323130',
                bodyTextChecked: '#000000',
                link: this.resolvedColors.primaryColor || '#0078d4',
                linkHovered: '#004578',
                primaryButtonBackground: this.resolvedColors.primaryColor || '#0078d4',
                primaryButtonBorder: 'transparent',
                primaryButtonText: '#ffffff',
                inputBorder: '#605e5c',
                inputBackground: '#ffffff',
                inputText: '#323130'
            },
            fonts: {
                tiny: { fontSize: '10px' },
                xSmall: { fontSize: '11px' },
                small: { fontSize: '12px' },
                smallPlus: { fontSize: '13px' },
                medium: { fontSize: '14px' },
                mediumPlus: { fontSize: '15px' },
                large: { fontSize: '17px' },
                xLarge: { fontSize: '21px' },
                xxLarge: { fontSize: '28px' },
                superLarge: { fontSize: '42px' },
                mega: { fontSize: '68px' }
            },
            isInverted: isInverted,
            disableGlobalClassNames: false
        };
    }

    applyThemeToWebPart(domElement: HTMLElement): void {
        domElement.style.setProperty('--themePrimary', this.resolvedColors.primaryColor || '#0078d4');
        domElement.style.setProperty('--bodyBackground', this.resolvedColors.backgroundColor || '#ffffff');
        domElement.style.setProperty('--bodyText', this.resolvedColors.textColor || '#323130');
        domElement.style.fontFamily = "'Segoe UI', 'Segoe UI Web (West European)', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif";
    }

    getTheme(): any {
        return this.sharePointTheme;
    }
}
