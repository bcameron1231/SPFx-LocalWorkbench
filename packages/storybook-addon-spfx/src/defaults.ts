import {
  DEFAULT_PAGE_CONTEXT,
  deepMerge,
  isRtlCulture,
  type IPageContextConfig,
} from '@spfx-local-workbench/shared';

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
export function mergePageContext(
  provided: Partial<IPageContextConfig> = {},
  locale?: string,
): IPageContextConfig {
  // Handle locale override for cultureInfo
  const mergedContext = deepMerge(
    structuredClone(DEFAULT_PAGE_CONTEXT),
    provided,
  ) as IPageContextConfig;

  if (locale) {
    mergedContext.cultureInfo.currentCultureName = locale;
    mergedContext.cultureInfo.currentUICultureName = locale;
    if (provided.cultureInfo?.isRightToLeft === undefined) {
      mergedContext.cultureInfo.isRightToLeft = isRtlCulture(locale);
    }
  }

  return mergedContext;
}
