import { ILocalizedString } from "../types";

/**
 * Retrieves the localized string for a given locale, falling back to the default if not available.
 * @param lstring The localized string object.
 * @param locale The desired locale.
 * @returns The localized string.
 */
export const getLocalizedString = (lstring?: ILocalizedString, locale?: string): string => {
    if (!lstring) {return '';}
    if (locale && lstring[locale]) {
        return lstring[locale];
    }
    return lstring.default;
};
