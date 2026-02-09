import type { IContextSettings, IPageContextSettings } from '../types';

const defaultContextSettings: IContextSettings = {
    siteUrl: 'https://contoso.sharepoint.com/sites/devsite',
    webUrl: 'https://contoso.sharepoint.com/sites/devsite',
    userDisplayName: 'Local Workbench User',
    userEmail: 'user@contoso.onmicrosoft.com',
    userLoginName: 'i:0#.f|membership|user@contoso.onmicrosoft.com',
    culture: 'en-US',
    isAnonymousGuestUser: false,
    customContext: {}
};

const defaultPageContextSettings: IPageContextSettings = {
    webTitle: 'Local Workbench',
    webDescription: 'Local development workbench for SPFx web parts',
    webTemplate: 'STS#3',
    isNoScriptEnabled: false,
    isSPO: true
};

export class SpfxContext {
    private contextSettings: IContextSettings;
    private pageContextSettings: IPageContextSettings;

    constructor(
        contextSettings?: Partial<IContextSettings>,
        pageContextSettings?: Partial<IPageContextSettings>
    ) {
        this.contextSettings = { ...defaultContextSettings, ...contextSettings };
        this.pageContextSettings = { ...defaultPageContextSettings, ...pageContextSettings };
    }

    createMockContext(webPartId: string, instanceId: string): any {
        const siteUrl = new URL(this.contextSettings.siteUrl);
        const webUrl = new URL(this.contextSettings.webUrl);
        const siteServerRelativeUrl = siteUrl.pathname === '/' ? '/' : siteUrl.pathname;
        const webServerRelativeUrl = webUrl.pathname === '/' ? '/' : webUrl.pathname;
        const languageCode = this.getLanguageCodeFromCulture(this.contextSettings.culture);

        const mockPageContext = {
            web: {
                absoluteUrl: this.contextSettings.webUrl,
                serverRelativeUrl: webServerRelativeUrl,
                id: { toString: () => '00000000-0000-4000-b000-777777777777' },
                title: this.pageContextSettings.webTitle,
                description: this.pageContextSettings.webDescription,
                language: languageCode,
                languageName: this.contextSettings.culture,
                isNoScriptEnabled: this.pageContextSettings.isNoScriptEnabled,
                permissions: { hasPermission: () => true },
                templateName: this.pageContextSettings.webTemplate
            },
            site: {
                absoluteUrl: this.contextSettings.siteUrl,
                serverRelativeUrl: siteServerRelativeUrl,
                id: { toString: () => '00000000-0000-4000-b000-666666666666' }
            },
            user: {
                displayName: this.contextSettings.userDisplayName,
                email: this.contextSettings.userEmail,
                loginName: this.contextSettings.userLoginName,
                isAnonymousGuestUser: this.contextSettings.isAnonymousGuestUser,
                isExternalGuestUser: false
            },
            list: null,
            listItem: null,
            cultureInfo: {
                currentCultureName: this.contextSettings.culture,
                currentUICultureName: this.contextSettings.culture,
                isRightToLeft: this.isRtlCulture(this.contextSettings.culture)
            },
            legacyPageContext: {
                webAbsoluteUrl: this.contextSettings.webUrl,
                webServerRelativeUrl: webServerRelativeUrl,
                siteAbsoluteUrl: this.contextSettings.siteUrl,
                siteServerRelativeUrl: siteServerRelativeUrl,
                userDisplayName: this.contextSettings.userDisplayName,
                userEmail: this.contextSettings.userEmail,
                userLoginName: this.contextSettings.userLoginName,
                userId: 1,
                webTitle: this.pageContextSettings.webTitle,
                webDescription: this.pageContextSettings.webDescription,
                webId: '00000000-0000-4000-b000-777777777777',
                siteId: '00000000-0000-4000-b000-666666666666',
                currentCultureName: this.contextSettings.culture,
                currentUICultureName: this.contextSettings.culture,
                webLanguage: languageCode,
                isNoScriptEnabled: this.pageContextSettings.isNoScriptEnabled,
                isSPO: this.pageContextSettings.isSPO,
                aadTenantId: '00000000-0000-4000-b000-000000000000',
                ...this.contextSettings.customContext
            }
        };

        return {
            instanceId: instanceId,
            manifest: { id: webPartId },
            pageContext: mockPageContext,
            serviceScope: {
                consume: (key: any) => {
                    return {};
                },
                createChildScope: () => ({
                    consume: () => ({}),
                    finish: () => {}
                }),
                finish: () => {}
            },
            httpClient: this.createMockHttpClient(),
            spHttpClient: this.createMockSpHttpClient(),
            aadHttpClientFactory: {
                getClient: () => Promise.resolve(this.createMockHttpClient())
            },
            msGraphClientFactory: {
                getClient: () => Promise.resolve({
                    api: () => ({
                        get: () => Promise.resolve({}),
                        post: () => Promise.resolve({}),
                        patch: () => Promise.resolve({}),
                        delete: () => Promise.resolve({})
                    })
                })
            },
            sdks: {
                microsoftTeams: undefined // Not running in Teams context
            },
            isServedFromLocalhost: true,
            domElement: null,
            propertyPane: {
                refresh: () => {},
                open: () => {},
                close: () => {},
                isRenderedByWebPart: () => true,
                isPropertyPaneOpen: () => false
            }
        };
    }

    private isRtlCulture(culture: string): boolean {
        const rtlCultures = ['ar', 'he', 'fa', 'ur'];
        const langCode = culture.split('-')[0].toLowerCase();
        return rtlCultures.includes(langCode);
    }

    private createMockHttpClient(): any {
        return {
            get: (_url: string, _config?: any) => Promise.resolve({ 
                ok: true, 
                json: () => Promise.resolve({}) 
            }),
            post: (_url: string, _config?: any, _options?: any) => Promise.resolve({ 
                ok: true, 
                json: () => Promise.resolve({}) 
            }),
            fetch: (_url: string, _config?: any, _options?: any) => Promise.resolve({ 
                ok: true, 
                json: () => Promise.resolve({}) 
            })
        };
    }

    private createMockSpHttpClient(): any {
        const configurations = {
            v1: { flags: {} }
        };
        return {
            configurations: configurations,
            get: (_url: string, _config?: any) => Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ d: {} })
            }),
            post: (_url: string, _config?: any, _options?: any) => Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ d: {} })
            }),
            fetch: (_url: string, _config?: any, _options?: any) => Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ d: {} })
            })
        };
    }

    private getLanguageCodeFromCulture(culture: string): number {
        const cultureMap: Record<string, number> = {
            'en-US': 1033, 'en-GB': 2057, 'de-DE': 1031, 'fr-FR': 1036,
            'es-ES': 3082, 'it-IT': 1040, 'pt-BR': 1046, 'pt-PT': 2070,
            'nl-NL': 1043, 'ja-JP': 1041, 'zh-CN': 2052, 'zh-TW': 1028,
            'ko-KR': 1042, 'ru-RU': 1049, 'ar-SA': 1025, 'he-IL': 1037,
            'pl-PL': 1045, 'sv-SE': 1053, 'da-DK': 1030, 'fi-FI': 1035,
            'no-NO': 1044, 'tr-TR': 1055
        };
        return cultureMap[culture] || 1033; // Default to en-US
    }
}
