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

function createMockPermissions(permissions?: { [key: string]: any }): any {
  if (!permissions) {
    return undefined;
  }

  return {
    ...permissions,
    hasPermission: () => true,
  };
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
  const listId = config.list?.id ?? DEFAULT_PAGE_CONTEXT.list?.id;
  const siteCorrelationId =
    config.site.correlationId ?? DEFAULT_PAGE_CONTEXT.site.correlationId;
  const currentUICultureName =
    config.cultureInfo.currentUICultureName ?? config.cultureInfo.currentCultureName;
  const isRightToLeft =
    config.cultureInfo.isRightToLeft ?? isRtlCulture(config.cultureInfo.currentCultureName);
  const isNoScriptEnabled =
    config.site.isNoScriptEnabled ?? config.legacyPageContext?.isNoScriptEnabled ?? false;
  const isSPO = config.legacyPageContext?.isSPO ?? true;
  const legacyPageContextDefaults = {
    CorrelationId: siteCorrelationId,
    RecycleBinItemCount:
      config.site.recycleBinItemCount ?? DEFAULT_PAGE_CONTEXT.site.recycleBinItemCount,
    aadTenantId:
      DEFAULT_PAGE_CONTEXT.legacyPageContext?.aadTenantId ??
      '00000000-0000-4000-b000-000000000000',
    cdnPrefix: config.site.cdnPrefix ?? DEFAULT_PAGE_CONTEXT.site.cdnPrefix,
    currentCultureName: config.cultureInfo.currentCultureName,
    currentUICultureName,
    isAnonymousGuestUser:
      config.user.isAnonymousGuestUser ?? DEFAULT_PAGE_CONTEXT.user.isAnonymousGuestUser,
    isAppWeb: config.web.isAppWeb ?? DEFAULT_PAGE_CONTEXT.web.isAppWeb,
    isExternalGuestUser:
      config.user.isExternalGuestUser ?? DEFAULT_PAGE_CONTEXT.user.isExternalGuestUser,
    isNoScriptEnabled,
    isSPO,
    listId: listId ? `{${listId}}` : undefined,
    listPermsMask: {
      High:
        config.list?.permissions?.value?.High ??
        DEFAULT_PAGE_CONTEXT.list?.permissions?.value?.High ??
        0,
      Low:
        config.list?.permissions?.value?.Low ??
        DEFAULT_PAGE_CONTEXT.list?.permissions?.value?.Low ??
        0,
    },
    listTitle: config.list?.title ?? DEFAULT_PAGE_CONTEXT.list?.title ?? '',
    listUrl: config.list?.serverRelativeUrl ?? DEFAULT_PAGE_CONTEXT.list?.serverRelativeUrl ?? '',
    preferUserTimeZone:
      config.user.preferUserTimeZone ?? DEFAULT_PAGE_CONTEXT.user.preferUserTimeZone,
    siteAbsoluteUrl: config.site.absoluteUrl,
    siteClassification: config.site.classification ?? DEFAULT_PAGE_CONTEXT.site.classification,
    siteId: siteId ? `{${siteId}}` : undefined,
    sitePagesEnabled:
      config.site.sitePagesEnabled ?? DEFAULT_PAGE_CONTEXT.site.sitePagesEnabled,
    siteServerRelativeUrl: siteServerRelativeUrl,
    userDisplayName: config.user.displayName,
    userEmail: config.user.email,
    userId: config.legacyPageContext?.userId ?? DEFAULT_PAGE_CONTEXT.legacyPageContext?.userId,
    userLoginName: config.user.loginName,
    webAbsoluteUrl: config.web.absoluteUrl,
    webDescription: config.web.description,
    webId: webId ? `{${webId}}` : undefined,
    webLanguage: language,
    webLanguageName: config.web.languageName ?? DEFAULT_PAGE_CONTEXT.web.languageName,
    webLogoUrl: config.web.logoUrl ?? DEFAULT_PAGE_CONTEXT.web.logoUrl,
    webPermMasks: {
      High:
        config.web.permissions?.value?.High ??
        DEFAULT_PAGE_CONTEXT.web.permissions?.value?.High ??
        0,
      Low:
        config.web.permissions?.value?.Low ??
        DEFAULT_PAGE_CONTEXT.web.permissions?.value?.Low ??
        0,
    },
    webServerRelativeUrl: webServerRelativeUrl,
    webTemplate: config.web.templateName ?? DEFAULT_PAGE_CONTEXT.web.templateName,
    webTitle: config.web.title,
  };

  return {
    ...config,
    isInitialized: config.isInitialized ?? true,
    web: {
      ...config.web,
      id: MockGuid.parse(webId),
      language,
      languageName: config.web.languageName ?? config.cultureInfo.currentCultureName,
      permissions: createMockPermissions(config.web.permissions),
      serverRelativeUrl: webServerRelativeUrl,
    },
    site: {
      ...config.site,
      correlationId: siteCorrelationId ? MockGuid.parse(siteCorrelationId) : undefined,
      id: MockGuid.parse(siteId),
      isNoScriptEnabled,
      serverRelativeUrl: siteServerRelativeUrl,
    },
    user: {
      ...config.user,
      isExternalGuestUser: config.user.isExternalGuestUser ?? false,
      preferUserTimeZone: config.user.preferUserTimeZone ?? false,
    },
    cultureInfo: {
      ...config.cultureInfo,
      currentUICultureName,
      isRightToLeft,
    },
    list: config.list
      ? {
          ...config.list,
          id: listId ? MockGuid.parse(listId) : undefined,
          permissions: createMockPermissions(config.list.permissions),
        }
      : null,
    listItem: config.listItem ?? null,
    legacyPageContext: {
      ...legacyPageContextDefaults,
      ...config.legacyPageContext,
    },
  };
}
