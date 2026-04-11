/**
 * Localized string with default and locale-specific values
 * Used by SPFx component manifests for titles, descriptions, etc.
 */
export interface ILocalizedString {
  default: string;
  [locale: string]: string;
}
