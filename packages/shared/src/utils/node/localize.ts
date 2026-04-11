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

// Map of bundle name to loaded strings
const bundles = new Map<string, Record<string, string>>();
let activeBundleName: string | null = null;

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
  if (bundles.has(bundleName)) {
    console.warn(
      `Localization bundle "${bundleName}" already initialized. Skipping re-initialization.`,
    );
    return;
  }

  const locale = getLocale() || 'en';
  const bundlePath = path.join(baseDir, bundleName);

  // Build fallback chain: exact locale -> base language -> default
  const localeChain: string[] = [];
  if (locale.includes('-')) {
    // Try full locale (e.g., fr-FR)
    localeChain.push(locale);
    // Try base language (e.g., fr)
    localeChain.push(locale.split('-')[0]);
  } else {
    localeChain.push(locale);
  }
  // Always fall back to default
  localeChain.push('default');

  let loadedStrings: Record<string, string> = {};
  let loaded = false;

  for (const loc of localeChain) {
    const nlsFile = loc === 'default' ? `${bundlePath}.nls.json` : `${bundlePath}.nls.${loc}.json`;

    if (fs.existsSync(nlsFile)) {
      try {
        const content = fs.readFileSync(nlsFile, 'utf-8');
        loadedStrings = JSON.parse(content);
        loaded = true;
        break;
      } catch (error) {
        console.error(`Failed to parse localization file: ${nlsFile}`, error);
        // Continue to next fallback
      }
    }
  }

  if (!loaded) {
    console.warn(`No localization files found for bundle "${bundleName}". Using empty bundle.`);
  }

  bundles.set(bundleName, loadedStrings);
  if (!activeBundleName) {
    activeBundleName = bundleName;
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
  if (!activeBundleName) {
    console.warn(
      'Localization not initialized. Call initializeLocalization() first. Using default message.',
    );
    return formatMessage(defaultMessage, args);
  }

  const strings = bundles.get(activeBundleName) || {};
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
  return activeBundleName !== null;
}

/**
 * Set the active bundle for localization lookups.
 *
 * @param bundleName The bundle to make active, or null to clear
 */
export function setActiveBundle(bundleName: string | null): void {
  if (bundleName && !bundles.has(bundleName)) {
    console.warn(`Bundle "${bundleName}" not found. Call initializeLocalization() first.`);
    return;
  }
  activeBundleName = bundleName;
}

/**
 * Reset localization state (primarily for testing).
 * NOT recommended for production use.
 */
export function resetLocalization(): void {
  bundles.clear();
  activeBundleName = null;
}
