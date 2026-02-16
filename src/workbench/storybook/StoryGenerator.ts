/**
 * Story Generator for SPFx Components
 * 
 * Generates Storybook CSF 3.0 story files from SPFx component manifests.
 * Supports automatic locale variants and configuration injection.
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '@spfx-local-workbench/shared/utils/logger';
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

    constructor(detector: SpfxProjectDetector, config?: Partial<IStoryGeneratorConfig>) {
        this.detector = detector;
        this.workspacePath = detector.workspacePath;
        this.outputDir = config?.outputDir || path.join(this.workspacePath, 'temp', 'storybook', 'generated');
        this.generateLocaleStories = config?.generateLocaleStories ?? true;
        this.pageContext = config?.pageContext || DEFAULT_PAGE_CONTEXT;
    }

    /**
     * Generates all stories for the SPFx project
     * @returns Array of generated story information
     */
    public async generateStories(): Promise<IGeneratedStory[]> {
        const generatedStories: IGeneratedStory[] = [];

        // Clean up previously generated stories
        await this.cleanGeneratedStories();

        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });

        // Get web part manifests
        const webParts = await this.detector.getWebPartManifests();
        if (webParts.length === 0) {
            logger.info('StoryGenerator - No web parts found');
            return generatedStories;
        }

        // Get locale information
        const localeInfo = this.generateLocaleStories 
            ? await this.detector.getLocaleInfo() 
            : { default: 'en-US', locales: ['en-US'] };

        // Generate a single story file for each web part containing all locale variants
        for (const webPart of webParts) {
            const story = await this.generateWebPartStory(webPart, localeInfo);
            generatedStories.push(story);
        }

        // Generate index file
        await this.generateIndexFile(generatedStories);

        return generatedStories;
    }

    /**
     * Generates a single story file for a web part with all locale variants
     */
    private async generateWebPartStory(
        manifest: IWebPartManifest,
        localeInfo: { default: string; locales: string[] }
    ): Promise<IGeneratedStory> {
        const alias = manifest.alias;
        const componentId = manifest.id;
        const fileName = `${alias}.stories.ts`;
        const filePath = path.join(this.outputDir, fileName);

        // Get display name from preconfigured entries
        const preconfiguredEntry = manifest.preconfiguredEntries?.[0];
        const defaultTitle = getLocalizedString(preconfiguredEntry?.title, localeInfo.default) || alias;
        const properties = preconfiguredEntry?.properties || {};

        // Generate story content with all locale variants
        const storyContent = this.generateStoryContent({
            componentId,
            alias,
            title: defaultTitle,
            defaultLocale: localeInfo.default,
            locales: localeInfo.locales,
            properties
        });

        // Write story file
        await fs.writeFile(filePath, storyContent, 'utf8');

        return {
            filePath,
            componentId,
            alias
        };
    }

    /**
     * Generates the TypeScript content for a story file with all locale variants
     */
    private generateStoryContent(options: {
        componentId: string;
        alias: string;
        title: string;
        defaultLocale: string;
        locales: string[];
        properties: Record<string, unknown>;
    }): string {
        const { componentId, alias, title, defaultLocale, locales, properties } = options;

        // Create the shared parameters object
        const pageContextForDefault = {
            ...this.pageContext,
            cultureInfo: {
                ...this.pageContext.cultureInfo,
                currentCultureName: defaultLocale
            }
        };

        const sharedParameters = {
            spfx: {
                componentId: componentId,
                locale: defaultLocale,
                properties: properties,
                context: {
                    pageContext: pageContextForDefault
                }
            }
        };

        // Header comment
        let content = `/**
 * Auto-generated Storybook story for ${alias}
 * Component ID: ${componentId}
 * Default Locale: ${defaultLocale}
 * 
 * This file is automatically generated. Do not edit directly.
 * To customize, create manual stories in your src directory.
 */

import type { Meta, StoryObj } from '@storybook/react';

const sharedParameters = ${JSON.stringify(sharedParameters, null, 2)};

// Component metadata
const meta = {
  title: 'Web Parts/${title}',
  parameters: sharedParameters,
  tags: ['autodocs']
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story
 */
export const Default: Story = {};
`;

        // Generate additional locale stories
        const additionalLocales = locales.filter(locale => locale !== defaultLocale);
        additionalLocales.forEach((locale, index) => {
            content += `
/**
 * Locale${index + 1} story: ${locale}
 */
export const Locale${index + 1}: Story = {
  name: '${locale}',
  parameters: {
    ...sharedParameters,
    spfx: {
      ...sharedParameters.spfx,
      locale: '${locale}',
    }
  }
};
`;
        });

        return content;
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
            logger.error('StoryGenerator - Error cleaning generated stories:', error);
        }
    }
}
