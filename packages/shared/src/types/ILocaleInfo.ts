/**
 * Locale information for an SPFx project
 */
export interface ILocaleInfo {
  /** Default locale code (e.g. 'en-US') */
  default: string;
  /** All available locale codes, sorted */
  locales: string[];
}
