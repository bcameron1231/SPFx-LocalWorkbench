import { DEFAULT_PAGE_CONTEXT, deepMerge } from '@spfx-local-workbench/shared';

/**
 * Default values for SPFx context
 *
 * NOTE: Default values come from @spfx-local-workbench/shared package.
 * The addon re-exports them for convenience and backward compatibility.
 *
 * When a story generator pre-populates page context via the `spfxPageContext`
 * global, these defaults are overridden at runtime.
 * These exist primarily for standalone Storybook usage.
 */

/**
 * Default SPFx pageContext structure (re-exported from shared mocks package)
 */
export { DEFAULT_PAGE_CONTEXT };

/**
 * Merge utility for pageContext objects
 * Merges provided context with defaults, preserving additional properties
 */
export function mergePageContext(provided: any = {}, locale?: string): typeof DEFAULT_PAGE_CONTEXT {
  // Handle locale override for cultureInfo
  const mergedContext = deepMerge({ ...DEFAULT_PAGE_CONTEXT }, provided);

  if (locale && !provided.cultureInfo?.currentCultureName) {
    mergedContext.cultureInfo.currentCultureName = locale;
  }

  return mergedContext;
}
