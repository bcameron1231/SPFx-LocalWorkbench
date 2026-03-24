import * as fs from 'fs';
import * as path from 'path';

/**
 * Generic localization utility for bundled packages.
 *
 * Each package can initialize its own localization bundle by calling
 * initializeLocalization() with its bundle name and base directory.
 *
 * Usage:
 * ```typescript
 * import { initializeLocalization, localize } from '@spfx-local-workbench/shared';
 *
 * // In VS Code extension:
 * import * as vscode from 'vscode';
 * initializeLocalization('extension', __dirname, () => vscode.env.language);
 *
 * // In Node.js package:
 * initializeLocalization('shared', __dirname, () => process.env.LANG?.substring(0, 2) || 'en');
 *
 * // Then use localize anywhere:
 * const msg = localize('key', 'Default message', arg1, arg2);
 * ```
 */

let strings: Record<string, string> = {};
let initialized = false;

/**
 * Initialize localization for a specific bundle.
 *
 * @param bundleName The base name of the .nls.json files (e.g., 'extension', 'shared')
 * @param baseDir The directory containing the .nls.json files (usually __dirname)
 * @param getLocale Function that returns the current locale (e.g., () => vscode.env.language)
 */
export function initializeLocalization(
  bundleName: string,
  baseDir: string,
  getLocale: () => string,
): void {
  if (initialized) {
    console.warn(
      `Localization already initialized. Skipping re-initialization for bundle: ${bundleName}`,
    );
    return;
  }

  const locale = getLocale() || 'en';
  const bundlePath = path.join(baseDir, bundleName);

  // Try locale-specific file first (e.g., extension.nls.fr.json)
  let nlsFile = `${bundlePath}.nls.${locale}.json`;
  if (!fs.existsSync(nlsFile)) {
    // Fall back to default (e.g., extension.nls.json)
    nlsFile = `${bundlePath}.nls.json`;
  }

  try {
    const content = fs.readFileSync(nlsFile, 'utf-8');
    strings = JSON.parse(content);
    initialized = true;
  } catch (error) {
    console.error(`Failed to load localization file: ${nlsFile}`, error);
    strings = {};
    initialized = true; // Mark as initialized even on error to prevent retries
  }
}

/**
 * Localize a string using loaded translations.
 * Compatible with vscode-nls signature.
 *
 * @param key The localization key
 * @param defaultMessage The default message if key not found
 * @param args Optional arguments to format into the message using {0}, {1}, etc.
 * @returns The localized message with arguments substituted
 *
 * @example
 * localize('error.notFound', 'File not found: {0}', filename)
 */
export function localize(key: string, defaultMessage: string, ...args: any[]): string {
  if (!initialized) {
    console.warn(
      'Localization not initialized. Call initializeLocalization() first. Using default message.',
    );
    return formatMessage(defaultMessage, args);
  }

  const message = strings[key] || defaultMessage;
  return formatMessage(message, args);
}

/**
 * Format a message by replacing {0}, {1}, etc. with provided arguments.
 */
function formatMessage(message: string, args: any[]): string {
  let formatted = message;
  args.forEach((arg, index) => {
    formatted = formatted.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
  });
  return formatted;
}

/**
 * Check if localization has been initialized.
 * Useful for testing or conditional initialization.
 */
export function isLocalizationInitialized(): boolean {
  return initialized;
}

/**
 * Reset localization state (primarily for testing).
 * NOT recommended for production use.
 */
export function resetLocalization(): void {
  strings = {};
  initialized = false;
}
