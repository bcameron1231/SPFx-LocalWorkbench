import { DEFAULT_PAGE_CONTEXT } from '../constants';
import type { IPageContextConfig } from '../types/IPageContextConfig';
import { MockGuid } from './MockGuid';

/**
 * Checks if a culture is right-to-left
 */
export function isRtlCulture(culture: string): boolean {
  const rtlCultures = ['ar', 'he', 'fa', 'ur'];
  const langCode = culture.split('-')[0].toLowerCase();
  return rtlCultures.includes(langCode);
}

/**
 * Gets the LCID (language code ID) from a culture string
 */
export function getLanguageCodeFromCulture(culture: string): number {
  const cultureMap: Record<string, number> = {
    'en-US': 1033,
    'en-GB': 2057,
    'de-DE': 1031,
    'fr-FR': 1036,
    'es-ES': 3082,
    'it-IT': 1040,
    'pt-BR': 1046,
    'pt-PT': 2070,
    'nl-NL': 1043,
    'ja-JP': 1041,
    'zh-CN': 2052,
    'zh-TW': 1028,
    'ko-KR': 1042,
    'ru-RU': 1049,
    'ar-SA': 1025,
    'he-IL': 1037,
    'pl-PL': 1045,
    'sv-SE': 1053,
    'da-DK': 1030,
    'fi-FI': 1035,
    'no-NO': 1044,
    'tr-TR': 1055,
  };
  return cultureMap[culture] || 1033; // Default to en-US
}

/**
 * Builds a mock SPFx pageContext with all computed properties
 * This ensures consistent behavior between webview and Storybook
 */
export function buildMockPageContext(config: IPageContextConfig): any {
  const siteServerRelativeUrl =
    config.site.serverRelativeUrl ?? new URL(config.site.absoluteUrl).pathname;
  const webServerRelativeUrl =
    config.web.serverRelativeUrl ?? new URL(config.web.absoluteUrl).pathname;
  const language =
    config.web.language ?? getLanguageCodeFromCulture(config.cultureInfo.currentCultureName);
  const siteId = config.site.id ?? DEFAULT_PAGE_CONTEXT.site.id;
  const webId = config.web.id ?? DEFAULT_PAGE_CONTEXT.web.id;

  return {
    ...config,
    web: {
      ...config.web,
      serverRelativeUrl: webServerRelativeUrl,
      id: MockGuid.parse(webId),
      language,
      languageName: config.web.languageName ?? config.cultureInfo.currentCultureName,
      permissions: { hasPermission: () => true },
    },
    site: {
      ...config.site,
      serverRelativeUrl: siteServerRelativeUrl,
      id: MockGuid.parse(siteId),
    },
    user: {
      ...config.user,
      isExternalGuestUser: config.user.isExternalGuestUser ?? false,
    },
    cultureInfo: {
      ...config.cultureInfo,
      currentUICultureName:
        config.cultureInfo.currentUICultureName ?? config.cultureInfo.currentCultureName,
      isRightToLeft:
        config.cultureInfo.isRightToLeft ?? isRtlCulture(config.cultureInfo.currentCultureName),
    },
    list: config.list ?? null,
    listItem: config.listItem ?? null,
    legacyPageContext: {
      webAbsoluteUrl: config.web.absoluteUrl,
      webServerRelativeUrl: webServerRelativeUrl,
      siteAbsoluteUrl: config.site.absoluteUrl,
      siteServerRelativeUrl: siteServerRelativeUrl,
      userDisplayName: config.user.displayName,
      userEmail: config.user.email,
      userLoginName: config.user.loginName,
      userId: 1,
      webTitle: config.web.title,
      webDescription: config.web.description,
      webId: `{${webId}}`,
      siteId: `{${siteId}}`,
      currentCultureName: config.cultureInfo.currentCultureName,
      currentUICultureName:
        config.cultureInfo.currentUICultureName ?? config.cultureInfo.currentCultureName,
      webLanguage: language,
      isNoScriptEnabled: config.isNoScriptEnabled ?? false,
      isSPO: config.isSPO ?? true,
      aadTenantId: '00000000-0000-4000-b000-000000000000',
    },
  };
}
