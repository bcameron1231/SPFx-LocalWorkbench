/**
 * Story Generator for SPFx Components
 *
 * Generates Storybook CSF 3.0 story files from SPFx component manifests.
 * Supports automatic locale variants and configuration injection.
 */
import * as fs from 'fs/promises';
import * as path from 'path';

import { DEFAULT_PAGE_CONTEXT, getLocalizedString } from '@spfx-local-workbench/shared';
import { logger } from '@spfx-local-workbench/shared/utils/logger';

import { SpfxProjectDetector } from '../SpfxProjectDetector';
import type { IWebPartManifest } from '../types';

export interface IStoryGeneratorConfig {
  /** Workspace path */
  workspacePath: string;
  /** Output directory for generated stories (default: .storybook-temp/generated) */
  outputDir?: string;
  /** Whether to generate locale variants (default: true) */
  generateLocaleStories?: boolean;
  /** Page context configuration to inject */
  pageContext?: typeof DEFAULT_PAGE_CONTEXT;
  /** Whether to enable auto-generated docs pages (default: false) */
  autoDocs?: boolean;
}

export interface IGeneratedStory {
  /** File path where story was written */
  filePath: string;
  /** Component ID */
  componentId: string;
  /** Component alias */
  alias: string;
  /** Index of the preconfiguredEntry this story was generated from */
  preconfiguredEntryIndex: number;
  /** Locale (if this is a locale variant) */
  locale?: string;
}

export class StoryGenerator {
  private readonly workspacePath: string;
  private readonly outputDir: string;
  private readonly generateLocaleStories: boolean;
  private readonly pageContext: typeof DEFAULT_PAGE_CONTEXT;
  private readonly autoDocs: boolean;
  private readonly detector: SpfxProjectDetector;

  constructor(detector: SpfxProjectDetector, config?: Partial<IStoryGeneratorConfig>) {
    this.detector = detector;
    this.workspacePath = detector.workspacePath;
    this.outputDir =
      config?.outputDir || path.join(this.workspacePath, 'temp', 'storybook', 'generated');
    this.generateLocaleStories = config?.generateLocaleStories ?? true;
    this.pageContext = config?.pageContext || DEFAULT_PAGE_CONTEXT;
    this.autoDocs = config?.autoDocs ?? false;
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

    // Generate a story file for each preconfiguredEntry in each web part
    for (const webPart of webParts) {
      // Resolve locales specific to this web part so that a web part without
      // a given locale file doesn't get spurious locale variant stories.
      const localeInfo = this.generateLocaleStories
        ? await this.detector.getLocaleInfoForManifest(webPart)
        : { default: 'en-US', locales: ['en-US'] };

      const entries = webPart.preconfiguredEntries ?? [];
      const entryCount = entries.length;

      if (entryCount === 0) {
        // No preconfiguredEntries – generate a single story using defaults
        const story = await this.generateWebPartStory(webPart, localeInfo, 0, false);
        generatedStories.push(story);
      } else {
        for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
          const story = await this.generateWebPartStory(
            webPart,
            localeInfo,
            entryIndex,
            entryCount > 1,
          );
          generatedStories.push(story);
        }
      }
    }

    // Generate index file
    await this.generateIndexFile(generatedStories);

    return generatedStories;
  }

  /**
   * Generates a single story file for a web part preconfiguredEntry with all locale variants.
   * When a manifest has multiple entries, each gets its own file named with the entry title.
   */
  private async generateWebPartStory(
    manifest: IWebPartManifest,
    localeInfo: { default: string; locales: string[] },
    entryIndex: number,
    multipleEntries: boolean,
  ): Promise<IGeneratedStory> {
    const alias = manifest.alias;
    const componentId = manifest.id;

    // Resolve the preconfiguredEntry for this index
    const preconfiguredEntry = manifest.preconfiguredEntries?.[entryIndex];
    const defaultTitle = getLocalizedString(preconfiguredEntry?.title, localeInfo.default) || alias;
    const properties = preconfiguredEntry?.properties || {};

    // When there are multiple entries, append a sanitized entry title to avoid filename
    // collisions and to make the story file self-describing.
    const fileName = multipleEntries
      ? `${alias}--${this.sanitizeForFilename(defaultTitle)}.stories.ts`
      : `${alias}.stories.ts`;
    const filePath = path.join(this.outputDir, fileName);

    // The Storybook title includes the entry title when there are multiple entries so each
    // appears as a distinct component in the sidebar.
    // NOTE: the template always adds a 'Web Parts/' prefix, so we only provide
    // the path *within* that category here to avoid doubling the segment.
    const storyTitle = multipleEntries ? `${alias}/${defaultTitle}` : undefined;

    // Generate story content with all locale variants
    const storyContent = this.generateStoryContent({
      componentId,
      alias,
      title: storyTitle ?? defaultTitle,
      defaultLocale: localeInfo.default,
      locales: localeInfo.locales,
      properties,
      autoDocs: this.autoDocs,
      preconfiguredEntryIndex: entryIndex,
    });

    // Write story file
    await fs.writeFile(filePath, storyContent, 'utf8');

    return {
      filePath,
      componentId,
      alias,
      preconfiguredEntryIndex: entryIndex,
    };
  }

  /** Converts an arbitrary string into a safe filename segment. */
  private sanitizeForFilename(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9 _-]/g, '') // strip special chars
      .trim()
      .replace(/\s+/g, '-'); // spaces → hyphens
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
    autoDocs: boolean;
    preconfiguredEntryIndex: number;
  }): string {
    const {
      componentId,
      alias,
      title,
      defaultLocale,
      locales,
      properties,
      autoDocs,
      preconfiguredEntryIndex,
    } = options;

    // Create the shared parameters object
    const pageContextForDefault = {
      ...this.pageContext,
      cultureInfo: {
        ...this.pageContext.cultureInfo,
        currentCultureName: defaultLocale,
      },
    };

    const sharedParameters = {
      spfx: {
        componentId: componentId,
        preconfiguredEntryIndex: preconfiguredEntryIndex,
        locale: defaultLocale,
        properties: properties,
        context: {
          pageContext: pageContextForDefault,
        },
      },
    };

    // Header comment
    let content = `/**
 * Auto-generated Storybook story for ${alias} (entry ${preconfiguredEntryIndex})
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
  parameters: sharedParameters,${autoDocs ? "\n  tags: ['autodocs']" : ''}
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story
 */
export const Default: Story = {};
`;

    // Generate additional locale stories
    const additionalLocales = locales.filter((locale) => locale !== defaultLocale);
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
        const relativePath = `./${path.basename(story.filePath, '.ts')}`;
        return `import * as Story${index} from '${relativePath}';`;
      })
      .join('\n');

    const exports = stories.map((_, index) => `Story${index}`).join(', ');

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
    } catch (error: unknown) {
      logger.error('StoryGenerator - Error cleaning generated stories:', error);
    }
  }
}
