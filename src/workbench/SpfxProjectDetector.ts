import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';

import type {
  IExtensionManifest,
  ILocaleInfo,
  IWebPartManifest,
} from '@spfx-local-workbench/shared';
import { normalizeLocaleCasing } from '@spfx-local-workbench/shared';
import { isFileNotFoundError } from '@spfx-local-workbench/shared/utils/errorUtils';
import { logger } from '@spfx-local-workbench/shared/utils/logger';

import type { ISpfxConfig } from './types';

export class SpfxProjectDetector {
  public readonly workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  // Checks if the current workspace is an SPFx project
  public async isSpfxProject(): Promise<boolean> {
    const packageJsonPath = path.join(this.workspacePath, 'package.json');

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for SPFx dependencies
      return !!(
        dependencies['@microsoft/sp-core-library'] ||
        dependencies['@microsoft/sp-webpart-base'] ||
        dependencies['@microsoft/sp-application-base'] ||
        dependencies['@microsoft/generator-sharepoint']
      );
    } catch (error: unknown) {
      if (!isFileNotFoundError(error)) {
        logger.error('SpfxProjectDetector - Error reading package.json:', error);
      }
      return false;
    }
  }

  // Gets the SPFx version from the project
  public async getSpfxVersion(): Promise<string | undefined> {
    const packageJsonPath = path.join(this.workspacePath, 'package.json');

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      return (
        dependencies['@microsoft/sp-core-library'] || dependencies['@microsoft/sp-webpart-base']
      );
    } catch (_error: unknown) {
      return undefined;
    }
  }

  // Checks if the project uses Heft (SPFx 1.22+) instead of Gulp
  public async usesHeft(): Promise<boolean> {
    const packageJsonPath = path.join(this.workspacePath, 'package.json');

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for Heft dependencies (SPFx 1.22+)
      const hasHeft = !!(
        dependencies['@rushstack/heft'] || dependencies['@microsoft/sp-build-core-tasks']
      );

      // Also check if there's a serve script in package.json
      const hasServeScript = !!packageJson.scripts?.serve;

      return hasHeft || hasServeScript;
    } catch (_error: unknown) {
      return false;
    }
  }

  // Finds all web part manifests in the project
  public async getWebPartManifests(): Promise<IWebPartManifest[]> {
    const manifests: IWebPartManifest[] = [];

    // Look for manifest files in src directory
    const srcPath = path.join(this.workspacePath, 'src');
    logger.debug('SpfxProjectDetector - Looking for manifests in:', srcPath);

    try {
      await fs.access(srcPath);
    } catch {
      logger.debug('SpfxProjectDetector - src directory does not exist');
      return manifests;
    }

    const manifestFiles = await this.findManifestFiles(srcPath);
    logger.debug('SpfxProjectDetector - Found manifest files:', manifestFiles);

    for (const manifestFile of manifestFiles) {
      try {
        const content = await fs.readFile(manifestFile, 'utf8');
        // Remove BOM and comments (SPFx manifests can have comments)
        const cleanContent = this.removeJsonComments(content.replace(/^\uFEFF/, ''));
        const manifest = JSON.parse(cleanContent) as IWebPartManifest;

        logger.debug(
          'SpfxProjectDetector - Parsed manifest:',
          manifest.alias,
          'componentType:',
          manifest.componentType,
        );

        // Only include WebPart manifests
        if (manifest.componentType === 'WebPart') {
          manifests.push(manifest);
        }
      } catch (error: unknown) {
        logger.error(`SpfxProjectDetector - Error parsing manifest ${manifestFile}:`, error);
      }
    }

    return manifests;
  }

  // Finds all extension manifests in the project
  public async getExtensionManifests(): Promise<IExtensionManifest[]> {
    const manifests: IExtensionManifest[] = [];

    const srcPath = path.join(this.workspacePath, 'src');
    try {
      await fs.access(srcPath);
    } catch {
      return manifests;
    }

    const manifestFiles = await this.findManifestFiles(srcPath);

    for (const manifestFile of manifestFiles) {
      try {
        const content = await fs.readFile(manifestFile, 'utf8');
        const cleanContent = this.removeJsonComments(content.replace(/^\uFEFF/, ''));
        const manifest = JSON.parse(cleanContent) as IWebPartManifest | IExtensionManifest;

        // Include Extension manifests
        if (manifest.componentType === 'Extension') {
          manifests.push(manifest);
        }
      } catch (error: unknown) {
        logger.error(`SpfxProjectDetector - Error parsing manifest ${manifestFile}:`, error);
      }
    }

    return manifests;
  }

  // Gets the serve configuration
  public async getServeConfig(): Promise<{ initialPage?: string; port?: number }> {
    const serveConfigPath = path.join(this.workspacePath, 'config', 'serve.json');

    try {
      const content = await fs.readFile(serveConfigPath, 'utf8');
      const cleanContent = this.removeJsonComments(content);
      const config = JSON.parse(cleanContent);

      return {
        initialPage: config.initialPage,
        port: config.port || 4321,
      };
    } catch (_error: unknown) {
      return { port: 4321 };
    }
  }

  // Gets bundle configuration
  public async getBundleConfig(): Promise<ISpfxConfig | undefined> {
    const configPath = path.join(this.workspacePath, 'config', 'config.json');

    try {
      const content = await fs.readFile(configPath, 'utf8');
      const cleanContent = this.removeJsonComments(content);
      return JSON.parse(cleanContent);
    } catch (_error: unknown) {
      return undefined;
    }
  }

  // Recursively finds all manifest.json files
  private async findManifestFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && entry.name !== 'node_modules') {
        const subFiles = await this.findManifestFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.manifest.json')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Gets locale information scoped to a single web part manifest.
   * Only locales present in the manifest's own resource files are returned.
   * Falls back to project-wide locale info when no per-component resources are found.
   */
  public async getLocaleInfoForManifest(manifest: IWebPartManifest): Promise<ILocaleInfo> {
    const config = await this.getBundleConfig();
    const aliasLower = manifest.alias.toLowerCase();

    if (config?.localizedResources) {
      const localeSet = new Set<string>();

      for (const [resourceName, resourcePath] of Object.entries(config.localizedResources)) {
        // Match by resource key first (e.g. "HelloStorybookWebPartStrings" contains "HelloStorybookWebPart"),
        // then fall back to matching against the resource path directory segment.
        // Key-based matching is preferred because the directory name often omits the "WebPart" suffix.
        const matchesKey = resourceName.toLowerCase().includes(aliasLower);
        const matchesPath = resourcePath.toLowerCase().includes(aliasLower);
        if (!matchesKey && !matchesPath) {
          continue;
        }

        const pattern = resourcePath.replace('{locale}', '*');
        const lastSlash = pattern.lastIndexOf('/');
        if (lastSlash === -1) continue;

        const dirPath = path.join(this.workspacePath, pattern.substring(0, lastSlash));
        const filePattern = pattern.substring(lastSlash + 1);

        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile() && this.matchesPattern(entry.name, filePattern)) {
              const locale = this.extractLocaleFromPattern(entry.name, filePattern);
              if (locale) {
                localeSet.add(normalizeLocaleCasing(locale));
              }
            }
          }
        } catch {
          logger.debug(`SpfxProjectDetector - Localization dir not found: ${dirPath}`);
        }
      }

      if (localeSet.size > 0) {
        const locales = Array.from(localeSet).sort();
        const defaultLocale = locales[0];
        return { default: defaultLocale, locales };
      }
    }

    // Fallback: no per-component resources found, use project-wide defaults
    return { default: 'en-US', locales: ['en-US'] };
  }

  // Matches a filename against a simple glob pattern (supports * wildcard)
  private matchesPattern(filename: string, pattern: string): boolean {
    // Convert glob pattern to regex
    // Escape special regex characters except *
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filename);
  }

  // Extracts the locale value from a filename using a pattern (e.g., "en-us.js" from "*.js" -> "en-us")
  private extractLocaleFromPattern(filename: string, pattern: string): string | null {
    // Convert glob pattern to regex with a capture group for *
    // Escape special regex characters except *
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '(.+)'); // Convert * to capture group

    const regex = new RegExp(`^${regexPattern}$`);
    const match = regex.exec(filename);

    // Return the first capture group (the locale value)
    return match ? match[1] : null;
  }

  // Removes JSON comments and control characters (SPFx config files often have comments)
  // This handles JSONC (JSON with Comments) format used by SPFx
  private removeJsonComments(json: string): string {
    let result = '';
    let inString = false;
    let inSingleLineComment = false;
    let inMultiLineComment = false;
    let escapeNext = false;

    for (let i = 0; i < json.length; i++) {
      const char = json[i];
      const nextChar = json[i + 1];

      // Handle escape sequences in strings
      if (escapeNext) {
        escapeNext = false;
        if (inString) {
          result += char;
        }
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        result += char;
        continue;
      }

      // Handle single-line comments
      if (inSingleLineComment) {
        if (char === '\n') {
          inSingleLineComment = false;
          result += char; // Keep the newline
        }
        continue;
      }

      // Handle multi-line comments
      if (inMultiLineComment) {
        if (char === '*' && nextChar === '/') {
          inMultiLineComment = false;
          i++; // Skip the '/'
        }
        continue;
      }

      // Handle string boundaries
      if (char === '"' && !inSingleLineComment && !inMultiLineComment) {
        inString = !inString;
        result += char;
        continue;
      }

      // Detect comment starts (only outside of strings)
      if (!inString) {
        if (char === '/' && nextChar === '/') {
          inSingleLineComment = true;
          i++; // Skip the second '/'
          continue;
        }
        if (char === '/' && nextChar === '*') {
          inMultiLineComment = true;
          i++; // Skip the '*'
          continue;
        }
      }

      // Add character to result
      result += char;
    }

    // Remove any control characters that might cause issues
    result = result.replace(/[\x00-\x1F\x7F]/g, (match) => {
      // Keep newlines, tabs, and carriage returns
      if (match === '\n' || match === '\r' || match === '\t') {
        return match;
      }
      return '';
    });

    return result;
  }
}

// Creates a file system watcher for SPFx manifest changes
export function createManifestWatcher(
  workspaceFolder: vscode.WorkspaceFolder,
  onManifestChange: () => void,
): vscode.FileSystemWatcher {
  const pattern = new vscode.RelativePattern(workspaceFolder, '**/src/**/*.manifest.json');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  watcher.onDidChange(onManifestChange);
  watcher.onDidCreate(onManifestChange);
  watcher.onDidDelete(onManifestChange);

  return watcher;
}
