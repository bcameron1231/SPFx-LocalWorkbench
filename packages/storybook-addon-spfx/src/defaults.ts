import { DEFAULT_PAGE_CONTEXT } from '@spfx-local-workbench/shared';

/**
 * Default values for SPFx context
 * 
 * NOTE: Default values come from @spfx-local-workbench/shared package.
 * The addon re-exports them for convenience and backward compatibility.
 * 
 * When used via the VS Code extension, these defaults won't typically be used
 * because the story generator will inject config from VS Code settings.
 * These exist primarily for standalone Storybook usage.
 */

/**
 * Default SPFx pageContext structure (re-exported from shared mocks package)
 */
export { DEFAULT_PAGE_CONTEXT };

/**
 * Deep merge utility for pageContext objects
 * Merges provided context with defaults, preserving additional properties
 */
export function mergePageContext(
  provided: any = {},
  locale?: string
): typeof DEFAULT_PAGE_CONTEXT {
  return {
    site: {
      ...DEFAULT_PAGE_CONTEXT.site,
      ...(provided.site || {})
    },
    web: {
      ...DEFAULT_PAGE_CONTEXT.web,
      ...(provided.web || {})
    },
    user: {
      ...DEFAULT_PAGE_CONTEXT.user,
      ...(provided.user || {})
    },
    cultureInfo: {
      ...DEFAULT_PAGE_CONTEXT.cultureInfo,
      ...(provided.cultureInfo || {}),
      currentCultureName: provided.cultureInfo?.currentCultureName || locale || DEFAULT_PAGE_CONTEXT.cultureInfo.currentCultureName
    },
    isNoScriptEnabled: provided.isNoScriptEnabled ?? DEFAULT_PAGE_CONTEXT.isNoScriptEnabled,
    isSPO: provided.isSPO ?? DEFAULT_PAGE_CONTEXT.isSPO,
    // Include any additional properties from provided context
    ...Object.keys(provided).reduce((acc, key) => {
      if (!['site', 'web', 'user', 'cultureInfo', 'isNoScriptEnabled', 'isSPO'].includes(key)) {
        acc[key] = provided[key];
      }
      return acc;
    }, {} as Record<string, any>)
  };
}
