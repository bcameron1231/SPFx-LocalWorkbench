import { MICROSOFT_THEMES } from '../constants/MICROSOFT_THEMES';
import type { ITheme } from '../types';

/**
 * Builds a deduplicated theme list from multiple sources.
 *
 * Lists are merged in **priority order** — the first list wins on duplicate names.
 * Microsoft themes are always appended as the final layer, so callers never need
 * to pass MICROSOFT_THEMES explicitly.
 *
 * Priority (highest first):
 *   1. First list passed (e.g. story-level custom themes)
 *   2. Second list passed (e.g. VS Code workspace custom themes)
 *   3. MICROSOFT_THEMES
 *
 * Deduplication is by `name` (case-sensitive). The first occurrence of a name wins.
 * Custom themes in the result have `isCustom: true`; Microsoft themes retain `isCustom: false`.
 *
 * @param customLists - Theme lists in priority order (highest priority first). MICROSOFT_THEMES is always appended last.
 * @returns A single deduplicated, ordered array of ITheme objects
 *
 * @example
 * // Story themes override VS Code themes, which override Microsoft themes
 * const themes = buildThemeList(storyThemes, vsCodeThemes);
 */
export function buildThemeList(...customLists: ITheme[][]): ITheme[] {
  const addedThemeNames = new Set<string>();
  const result: ITheme[] = [];

  // Process custom lists in priority order, marking all entries as custom
  for (const list of customLists) {
    for (const theme of list) {
      if (!addedThemeNames.has(theme.name)) {
        addedThemeNames.add(theme.name);
        result.push({ ...theme, isCustom: true });
      }
    }
  }

  // Append Microsoft themes as the final layer (no isCustom override needed)
  // We allow microsoft themes to be overridden because you can technically hide a given theme in a tenant and then use the same name for a custom one
  //  reality is that it's an edge case, and it won't affect nearly anyone anyway
  for (const theme of MICROSOFT_THEMES) {
    if (!addedThemeNames.has(theme.name)) {
      addedThemeNames.add(theme.name);
      result.push(theme);
    }
  }

  return result;
}
