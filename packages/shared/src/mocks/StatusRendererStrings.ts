/**
 * Localized strings for StatusRenderer
 * Simple browser-side localization matching Microsoft's Strings.resx
 */

/**
 * String formatting utility - replaces {0}, {1}, etc. with provided arguments
 */
function format(template: string, ...args: any[]): string {
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    const argIndex = parseInt(index, 10);
    return argIndex < args.length ? String(args[argIndex]) : match;
  });
}

/**
 * StatusRenderer localized strings
 * Matches Microsoft's sp-webpart-base Strings.resx
 */
export const StatusRendererStrings = {
  /**
   * Loading status message - "{0}" is replaced with the loading message
   * Default: "Loading {0}..."
   */
  LoadingStatus: (loadingMessage: string): string => {
    return format('Loading {0}...', loadingMessage);
  },

  /**
   * Error message header in friendly error view
   * Default: "Something went wrong"
   */
  WebpartErrorSomethingWentWrong: 'Something went wrong',

  /**
   * Site admin advice in friendly error view
   * Default: "If you're a site administrator, please see the site logs for more details."
   */
  WebpartErrorSiteAdminAdvice:
    "If you're a site administrator, please see the site logs for more details.",

  /**
   * Technical details button text
   * Default: "Technical Details"
   */
  WebpartErrorTechnicalDetails: 'Technical Details',

  /**
   * Error text format - {0} is newline, {1} is error message, {2} is call stack, {3} is extra message
   * Default: "Error: {1}{2}{3}"
   */
  WebpartErrorErrorText: (
    newLine: string,
    errorMessage: string,
    callStack: string,
    extraMessage: string,
  ): string => {
    return format('Error: {1}{2}{3}', newLine, errorMessage, callStack, extraMessage);
  },

  /**
   * Call stack format - {0} is newline, {1} is stack trace
   * Default: "{0}Call stack:{0}{1}"
   */
  WebpartErrorCallStackText: (newLine: string, stack: string): string => {
    return format('{0}Call stack:{0}{1}', newLine, stack);
  },
};

/**
 * Future enhancement: Load locale-specific strings
 * This could be extended to support multiple languages by:
 * 1. Detecting browser locale (navigator.language)
 * 2. Loading locale-specific string bundles
 * 3. Falling back to English defaults
 *
 * Example:
 * export function initializeStatusRendererLocale(locale: string) {
 *   // Load locale-specific strings, e.g., from StatusRendererStrings.fr.ts
 * }
 */
