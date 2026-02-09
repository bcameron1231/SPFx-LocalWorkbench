import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
    IWebPartManifest,
    ISpfxConfig,
} from './types';

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
                ...packageJson.devDependencies
            };

            // Check for SPFx dependencies
            return !!(
                dependencies['@microsoft/sp-core-library'] ||
                dependencies['@microsoft/sp-webpart-base'] ||
                dependencies['@microsoft/sp-application-base'] ||
                dependencies['@microsoft/generator-sharepoint']
            );
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error('SpfxProjectDetector - Error reading package.json:', error);
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
                ...packageJson.devDependencies
            };
            return dependencies['@microsoft/sp-core-library'] || 
                   dependencies['@microsoft/sp-webpart-base'];
        } catch (error) {
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
                ...packageJson.devDependencies
            };

            // Check for Heft dependencies (SPFx 1.22+)
            const hasHeft = !!(
                dependencies['@rushstack/heft'] ||
                dependencies['@microsoft/sp-build-core-tasks']
            );

            // Also check if there's a serve script in package.json
            const hasServeScript = !!(packageJson.scripts?.serve);

            return hasHeft || hasServeScript;
        } catch (error) {
            return false;
        }
    }

    // Finds all web part manifests in the project
    public async getWebPartManifests(): Promise<IWebPartManifest[]> {
        const manifests: IWebPartManifest[] = [];
        
        // Look for manifest files in src directory
        const srcPath = path.join(this.workspacePath, 'src');
        console.log('Looking for manifests in:', srcPath);

        try {
            await fs.access(srcPath);
        } catch {
            console.log('src directory does not exist');
            return manifests;
        }

        const manifestFiles = await this.findManifestFiles(srcPath);
        console.log('Found manifest files:', manifestFiles);
        
        for (const manifestFile of manifestFiles) {
            try {
                const content = await fs.readFile(manifestFile, 'utf8');
                // Remove BOM and comments (SPFx manifests can have comments)
                const cleanContent = this.removeJsonComments(content.replace(/^\uFEFF/, ''));
                const manifest = JSON.parse(cleanContent) as IWebPartManifest;
                
                console.log('Parsed manifest:', manifest.alias, 'componentType:', manifest.componentType);
                
                // Only include WebPart manifests
                if (manifest.componentType === 'WebPart') {
                    manifests.push(manifest);
                }
            } catch (error) {
                console.error(`Error parsing manifest ${manifestFile}:`, error);
            }
        }

        return manifests;
    }

    // Finds all extension manifests in the project
    public async getExtensionManifests(): Promise<IWebPartManifest[]> {
        const manifests: IWebPartManifest[] = [];
        
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
                const manifest = JSON.parse(cleanContent) as IWebPartManifest;
                
                // Include Extension manifests
                if (manifest.componentType === 'Extension') {
                    manifests.push(manifest);
                }
            } catch (error) {
                console.error(`Error parsing manifest ${manifestFile}:`, error);
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
                port: config.port || 4321
            };
        } catch (error) {
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
        } catch (error) {
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
    onManifestChange: () => void
): vscode.FileSystemWatcher {
    const pattern = new vscode.RelativePattern(workspaceFolder, '**/src/**/*.manifest.json');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidChange(onManifestChange);
    watcher.onDidCreate(onManifestChange);
    watcher.onDidDelete(onManifestChange);

    return watcher;
}
