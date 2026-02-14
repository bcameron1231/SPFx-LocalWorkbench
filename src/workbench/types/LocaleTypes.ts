// Locale-related types and utilities for SPFx Local Workbench

/**
 * Locale information for a project
 */
export interface ILocaleInfo {
    default: string;
    locales: string[];
}

/**
 * Locale information mapped by component ID
 */
export interface IComponentLocales {
    [componentId: string]: string[];
}

/**
 * Standard locale casing mapping (lowercase -> standard format)
 * Maps common SharePoint locale codes from file naming convention (lowercase)
 * to standard locale format (e.g., 'en-us' -> 'en-US')
 */
export const LOCALE_CASING_MAP: Record<string, string> = {
    'ar-sa': 'ar-SA',
    'bg-bg': 'bg-BG',
    'ca-es': 'ca-ES',
    'cs-cz': 'cs-CZ',
    'cy-gb': 'cy-GB',
    'da-dk': 'da-DK',
    'de-at': 'de-AT',
    'de-ch': 'de-CH',
    'de-de': 'de-DE',
    'el-gr': 'el-GR',
    'en-au': 'en-AU',
    'en-ca': 'en-CA',
    'en-gb': 'en-GB',
    'en-ie': 'en-IE',
    'en-in': 'en-IN',
    'en-nz': 'en-NZ',
    'en-us': 'en-US',
    'en-za': 'en-ZA',
    'es-es': 'es-ES',
    'es-mx': 'es-MX',
    'et-ee': 'et-EE',
    'eu-es': 'eu-ES',
    'fi-fi': 'fi-FI',
    'fr-be': 'fr-BE',
    'fr-ca': 'fr-CA',
    'fr-ch': 'fr-CH',
    'fr-fr': 'fr-FR',
    'gl-es': 'gl-ES',
    'he-il': 'he-IL',
    'hi-in': 'hi-IN',
    'hr-hr': 'hr-HR',
    'hu-hu': 'hu-HU',
    'id-id': 'id-ID',
    'is-is': 'is-IS',
    'it-it': 'it-IT',
    'ja-jp': 'ja-JP',
    'kk-kz': 'kk-KZ',
    'ko-kr': 'ko-KR',
    'lt-lt': 'lt-LT',
    'lv-lv': 'lv-LV',
    'ms-my': 'ms-MY',
    'nb-no': 'nb-NO',
    'nl-be': 'nl-BE',
    'nl-nl': 'nl-NL',
    'pl-pl': 'pl-PL',
    'pt-br': 'pt-BR',
    'pt-pt': 'pt-PT',
    'ro-ro': 'ro-RO',
    'ru-ru': 'ru-RU',
    'sk-sk': 'sk-SK',
    'sl-si': 'sl-SI',
    'sr-cyrl-rs': 'sr-Cyrl-RS',
    'sr-latn-cs': 'sr-Latn-CS',
    'sr-latn-rs': 'sr-Latn-RS',
    'sv-se': 'sv-SE',
    'th-th': 'th-TH',
    'tr-tr': 'tr-TR',
    'uk-ua': 'uk-UA',
    'vi-vn': 'vi-VN',
    'zh-cn': 'zh-CN',
    'zh-tw': 'zh-TW'
};

/**
 * Normalizes locale code to standard casing format
 * @param locale Locale code (e.g., 'en-us' or 'en-US')
 * @returns Standardized locale code (e.g., 'en-US')
 */
export function normalizeLocaleCasing(locale: string): string {
    const lowercase = locale.toLowerCase();
    return LOCALE_CASING_MAP[lowercase] || locale;
}
