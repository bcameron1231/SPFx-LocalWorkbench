/**
 * Story Generator for SPFx Components
 * 
 * Generates Storybook CSF 3.0 story files from SPFx component manifests.
 * Supports automatic locale variants and configuration injection.
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SpfxProjectDetector } from '../SpfxProjectDetector';
import type { IWebPartManifest } from '../types';
import { DEFAULT_PAGE_CONTEXT, getLocalizedString, type ILocalizedString } from '@spfx-local-workbench/shared';

export interface IStoryGeneratorConfig {
    /** Workspace path */
    workspacePath: string;
    /** Output directory for generated stories (default: .storybook-temp/generated) */
    outputDir?: string;
    /** Whether to generate locale variants (default: true) */
    generateLocaleStories?: boolean;
    /** Page context configuration to inject */
    pageContext?: typeof DEFAULT_PAGE_CONTEXT;
}

export interface IGeneratedStory {
    /** File path where story was written */
    filePath: string;
    /** Component ID */
    componentId: string;
    /** Component alias */
    alias: string;
    /** Locale (if this is a locale variant) */
    locale?: string;
}

export class StoryGenerator {
    private readonly workspacePath: string;
    private readonly outputDir: string;
    private readonly generateLocaleStories: boolean;
    private readonly pageContext: typeof DEFAULT_PAGE_CONTEXT;
    private readonly detector: SpfxProjectDetector;

    constructor(config: IStoryGeneratorConfig) {
        this.workspacePath = config.workspacePath;
        this.outputDir = config.outputDir || path.join(this.workspacePath, '.storybook-temp', 'generated');
        this.generateLocaleStories = config.generateLocaleStories ?? true;
        this.pageContext = config.pageContext || DEFAULT_PAGE_CONTEXT;
        this.detector = new SpfxProjectDetector(this.workspacePath);
    }

    /**
     * Generates all stories for the SPFx project
     * @returns Array of generated story information
     */
    public async generateStories(): Promise<IGeneratedStory[]> {
        const generatedStories: IGeneratedStory[] = [];

        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });

        // Get web part manifests
        const webParts = await this.detector.getWebPartManifests();
        if (webParts.length === 0) {
            console.log('No web parts found');
            return generatedStories;
        }

        // Get locale information
        const localeInfo = this.generateLocaleStories 
            ? await this.detector.getLocaleInfo() 
            : { default: 'en-US', locales: ['en-US'] };

        // Generate stories for each web part
        for (const webPart of webParts) {
            // Generate default story (always generated)
            const defaultStory = await this.generateWebPartStory(webPart, localeInfo.default, true);
            generatedStories.push(defaultStory);

            // Generate locale-specific stories if enabled
            if (this.generateLocaleStories && localeInfo.locales.length > 1) {
                for (const locale of localeInfo.locales) {
                    if (locale !== localeInfo.default) {
                        const localeStory = await this.generateWebPartStory(webPart, locale, false);
                        generatedStories.push(localeStory);
                    }
                }
            }
        }

        // Generate index file
        await this.generateIndexFile(generatedStories);

        return generatedStories;
    }

    /**
     * Generates a single story file for a web part
     */
    private async generateWebPartStory(
        manifest: IWebPartManifest,
        locale: string,
        isDefault: boolean
    ): Promise<IGeneratedStory> {
        const alias = manifest.alias;
        const componentId = manifest.id;
        
        // Determine file name
        const fileName = isDefault 
            ? `${alias}.stories.ts`
            : `${alias}.${locale}.stories.ts`;
        
        const filePath = path.join(this.outputDir, fileName);

        // Get display name from preconfigured entries
        const preconfiguredEntry = manifest.preconfiguredEntries?.[0];
        const title = getLocalizedString(preconfiguredEntry?.title, locale) || alias;
        const description = getLocalizedString(preconfiguredEntry?.description, locale) || '';

        // Generate story content
        const storyContent = this.generateStoryContent({
            componentId,
            alias,
            title,
            description,
            locale,
            isDefault,
            properties: preconfiguredEntry?.properties || {}
        });

        // Write story file
        await fs.writeFile(filePath, storyContent, 'utf8');

        return {
            filePath,
            componentId,
            alias,
            locale: isDefault ? undefined : locale
        };
    }

    /**
     * Generates the TypeScript content for a story file
     */
    private generateStoryContent(options: {
        componentId: string;
        alias: string;
        title: string;
        description: string;
        locale: string;
        isDefault: boolean;
        properties: Record<string, unknown>;
    }): string {
        const { componentId, alias, title, description, locale, isDefault, properties } = options;

        // Create story title
        const storyTitle = isDefault 
            ? title 
            : `${title} (${locale})`;

        const localeComment = isDefault 
            ? ` * Default locale: ${locale}`
            : ` * Locale: ${locale}`;

        const pageContextJson = JSON.stringify({
            ...this.pageContext,
            cultureInfo: {
                ...this.pageContext.cultureInfo,
                currentCultureName: locale
            }
        }, null, 2);

        return `/**
 * Auto-generated Storybook story for ${alias}
 * Component ID: ${componentId}
${localeComment}
 * 
 * This file is automatically generated. Do not edit directly.
 * To customize, create manual stories in your src directory.
 */

import type { Meta, StoryObj } from '@storybook/react';

// Component metadata
const meta: Meta = {
  title: 'SPFx Components/${storyTitle}',
  parameters: {
    spfx: {
      componentId: '${componentId}',
      locale: '${locale}',
      properties: ${JSON.stringify(properties, null, 6).replace(/\n/g, '\n      ')},
      context: {
        pageContext: ${pageContextJson.replace(/\n/g, '\n          ')}
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj;

/**
 * Default story
 */
export const Default: Story = {};

/**
 * Read mode
 */
export const ReadMode: Story = {
  parameters: {
    spfx: {
      displayMode: 'Read'
    }
  }
};

/**
 * Edit mode
 */
export const EditMode: Story = {
  parameters: {
    spfx: {
      displayMode: 'Edit'
    }
  }
};

/**
 * With property pane open
 */
export const WithPropertyPane: Story = {
  parameters: {
    spfx: {
      showPropertyPane: true
    }
  }
};
`;
    }

    /**
     * Generates an index file that exports all generated stories
     */
    private async generateIndexFile(stories: IGeneratedStory[]): Promise<void> {
        const indexPath = path.join(this.outputDir, 'index.ts');
        
        const imports = stories
            .map((story, index) => {
                const relativePath = './' + path.basename(story.filePath, '.ts');
                return `import * as Story${index} from '${relativePath}';`;
            })
            .join('\n');

        const exports = stories
            .map((_, index) => `Story${index}`)
            .join(', ');

        const content = `/**
 * Auto-generated index of all SPFx component stories
 * 
 * This file is automatically generated. Do not edit directly.
 */

${imports}

export { ${exports} };
`;

        await fs.writeFile(indexPath, content, 'utf8');
    }

    /**
     * Cleans up generated stories directory
     */
    public async cleanGeneratedStories(): Promise<void> {
        try {
            await fs.rm(this.outputDir, { recursive: true, force: true });
        } catch (error) {
            console.error('Error cleaning generated stories:', error);
        }
    }
}
