/**
 * Configuration interface for SPFx page context
 * Used by buildMockPageContext to create a complete mock context
 */
export interface IPageContextConfig {
    site: {
        absoluteUrl: string;
        id?: string;
        serverRelativeUrl?: string;
        [key: string]: any;
    };
    web: {
        absoluteUrl: string;
        title: string;
        description: string;
        templateName: string;
        id?: string;
        serverRelativeUrl?: string;
        language?: number;
        languageName?: string;
        [key: string]: any;
    };
    user: {
        displayName: string;
        email: string;
        loginName: string;
        isAnonymousGuestUser: boolean;
        isExternalGuestUser?: boolean;
        [key: string]: any;
    };
    cultureInfo: {
        currentCultureName: string;
        currentUICultureName?: string;
        isRightToLeft?: boolean;
        [key: string]: any;
    };
    isNoScriptEnabled?: boolean;
    isSPO?: boolean;
    [key: string]: any;
}
