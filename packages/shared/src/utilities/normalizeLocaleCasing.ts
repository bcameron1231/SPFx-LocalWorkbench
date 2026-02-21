import { LOCALE_CASING_MAP } from '../constants/LOCALE_CASING_MAP';

/**
 * Normalizes locale code to standard casing format.
 * @param locale Locale code (e.g., `'en-us'` or `'en-US'`)
 * @returns Standardized locale code (e.g., `'en-US'`)
 */
export function normalizeLocaleCasing(locale: string): string {
  const lowercase = locale.toLowerCase();
  return LOCALE_CASING_MAP[lowercase] || locale;
}
