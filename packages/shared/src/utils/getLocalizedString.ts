/**
 * Utility functions for working with localized strings
 */
import type { ILocalizedString } from '../types';

/**
 * Gets a localized value from an ILocalizedString object
 *
 * Lookup order:
 * 1. Exact locale match (e.g., "en-US")
 * 2. Case-insensitive locale match (e.g., "en-us" matches "en-US")
 * 3. Default value
 *
 * @param localizedString - The localized string object
 * @param locale - The desired locale
 * @returns The localized string value, or empty string if no localized string provided
 */
export function getLocalizedString(
  localizedString: ILocalizedString | undefined,
  locale?: string,
): string {
  if (!localizedString) {
    return '';
  }

  // Return default if no locale specified
  if (!locale) {
    return localizedString.default;
  }

  // Try exact match
  if (localizedString[locale]) {
    return localizedString[locale];
  }

  // Try case-insensitive match
  const lowerLocale = locale.toLowerCase();
  const matchingKey = Object.keys(localizedString).find((key) => key.toLowerCase() === lowerLocale);
  if (matchingKey) {
    return localizedString[matchingKey];
  }

  // Fall back to default
  return localizedString.default;
}
