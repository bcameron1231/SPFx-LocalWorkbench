/**
 * SPFx-compatible implementation of @microsoft/load-themed-styles.
 *
 * SPFx web parts inject their CSS via `require('@microsoft/load-themed-styles').loadStyles(...)`.
 * This module is registered as the AMD module so web-part CSS actually reaches the DOM and
 * theme tokens like "[theme:themePrimary, default: #0078d4]" are resolved to CSS custom
 * property references: `var(--themePrimary, #0078d4)`.
 *
 * Because tokens are resolved to `var()` expressions the active theme is always reflected
 * automatically whenever `applyPaletteAsCssVars` updates the palette on the container or
 * document body — no style-element re-injection is required on theme change.
 *
 * Call `loadTheme(palette)` to keep `_currentTheme` in sync for callers that read it
 * directly; style elements are also re-processed (no-op in practice since the output is
 * identical) so the API remains backward-compatible.
 */

// Matches: "[theme: tokenName, default: #value]" with surrounding quotes as produced by
// @microsoft/sp-css-loader, e.g. "[theme: themePrimary, default: #0078d4]"
const THEME_TOKEN_REGEX = /["']\[theme:\s*(\w+)\s*(?:,\s*default:\s*([\w#.()\-\s,']+?))?\s*\]["']/g;

let _currentTheme: Record<string, string | number> = {};

interface ITrackedStyle {
  rawCss: string;
  styleElement: HTMLStyleElement;
}

const _themedStyles: ITrackedStyle[] = [];

function resolveTokens(css: string): string {
  return css.replace(
    THEME_TOKEN_REGEX,
    (_match: string, tokenName: string, defaultValue?: string) => {
      // Emit a CSS custom property reference so the active palette applied by
      // applyPaletteAsCssVars automatically cascades into the web part's styles.
      // The fallback value satisfies browsers without CSS variable support and
      // matches the contract defined by @microsoft/sp-css-loader.
      const fallback = defaultValue?.trim() ?? 'inherit';
      return `var(--${tokenName}, ${fallback})`;
    },
  );
}

/**
 * Processes a CSS string containing `[theme:token, default: color]` tokens and injects it as a
 * `<style>` element. Accepts both a plain string (with quoted `[theme:...]` tokens as produced
 * by older versions of @microsoft/sp-css-loader) and the chunked array format produced by
 * newer versions, where theme tokens are separate `{ theme, defaultValue }` objects.
 */
export function loadStyles(css: string | any[]): void {
  if (typeof document === 'undefined') {
    return;
  }

  let cssString: string;
  if (Array.isArray(css)) {
    // Each chunk is either { rawString: '...' } or { theme: 'tokenName', defaultValue: '#hex' }.
    // Convert theme-token chunks directly to var() references so they participate in
    // the CSS custom property cascade set up by applyPaletteAsCssVars.
    cssString = (css as any[])
      .map((chunk) => {
        if (chunk.rawString !== undefined) {
          return chunk.rawString as string;
        }
        if (chunk.theme !== undefined) {
          const fallback = (chunk.defaultValue as string | undefined)?.trim() ?? 'inherit';
          return `var(--${chunk.theme as string}, ${fallback})`;
        }
        return '';
      })
      .join('');
  } else {
    // Plain string — may contain quoted "[theme:token, default: value]" tokens.
    cssString = resolveTokens(css);
  }

  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-spfx-themed-styles', 'true');
  styleEl.textContent = cssString;
  document.head.appendChild(styleEl);
  // Store the original input so loadTheme can re-process if needed.
  _themedStyles.push({
    rawCss: Array.isArray(css) ? JSON.stringify(css) : css,
    styleElement: styleEl,
  });
}

/**
 * Updates the stored theme token values and syncs `window.__themeState__.theme`.
 *
 * Call this with the full flat theme produced by `buildFlatTheme(palette, isInverted)`
 * so that `__themeState__.theme` contains every token SharePoint web parts expect:
 * palette slots, semantic colors, flattened font ramp, and elevation effects.
 *
 * Theme tokens in SPFx CSS are resolved at style-injection time (not via CSS
 * custom properties) from `__themeState__.theme`.  Passing the full flat object
 * ensures that both the inline `@microsoft/load-themed-styles` copy bundled inside
 * web parts and our AMD-registered replacement see identical, complete token maps.
 *
 * @param theme - Full flat theme map from `buildFlatTheme()`.
 */
export function loadTheme(theme: Record<string, string | number>): void {
  // Full replacement — merging would let tokens from a previous theme bleed
  // through on any key absent from the new theme.
  _currentTheme = { ...theme };
  // Re-processing retained for backward-compatibility (our AMD-registered module).
  for (const tracked of _themedStyles) {
    tracked.styleElement.textContent = resolveTokens(tracked.rawCss);
  }
  // SPFx web part bundles typically ship their own inline copy of
  // @microsoft/load-themed-styles that stores state at window.__themeState__
  // rather than going through the AMD registry.  Sync the palette there so that
  // (a) future loadStyles calls from the inline copy resolve to real values and
  // (b) style elements already injected by the inline copy are re-resolved now.
  _syncInlineThemeState(theme);
}

/**
 * Updates the `window.__themeState__` object used by inline (non-AMD) copies of
 * @microsoft/load-themed-styles that SPFx web part bundles ship internally.
 * Resolves each registered themable style element to literal palette values so
 * theme changes are reflected immediately without a page reload.
 *
 * Receives the full flat theme from `buildFlatTheme()` so that every token
 * SharePoint web parts expect — palette, semantic colors, font ramp, effects —
 * is present in `__themeState__.theme`.
 */
function _syncInlineThemeState(theme: Record<string, string | number>): void {
  if (typeof window === 'undefined') return;

  // Pre-seed __themeState__ if the inline library hasn't initialised yet.
  if (!(window as any).__themeState__) {
    (window as any).__themeState__ = {};
  }
  const themeState = (window as any).__themeState__;

  // Full replacement — merging would let tokens from a previous theme survive.
  themeState.theme = { ...theme };

  // Re-resolve style elements that were already injected by the inline copy.
  // Each record is { styleElement, themableStyle } where themableStyle is a
  // ThemableArray: { rawString? } | { theme: tokenName, defaultValue? }.
  const records: any[] = themeState.registeredThemableStyles ?? [];
  for (const record of records) {
    const styleEl: HTMLStyleElement | undefined = record.styleElement;
    const themableStyle: any[] = record.themableStyle ?? [];
    if (!styleEl || !themableStyle.length) continue;
    const resolved = themableStyle
      .map((chunk: any) => {
        if (chunk.rawString !== undefined) return chunk.rawString as string;
        if (chunk.theme !== undefined) {
          const val = theme[chunk.theme as string];
          // Stringify numeric values (e.g. fontWeight: 400) for CSS injection.
          return val !== undefined ? String(val) : (chunk.defaultValue ?? 'inherit');
        }
        return '';
      })
      .join('');
    styleEl.textContent = resolved;
  }
}

/** Removes all style elements that were injected by `loadStyles`. */
export function clearStyles(): void {
  for (const tracked of _themedStyles) {
    if (tracked.styleElement.parentNode) {
      tracked.styleElement.parentNode.removeChild(tracked.styleElement);
    }
  }
  _themedStyles.length = 0;
}

/** Stub — configureLoadStyles is part of the public API but not needed here. */
export function configureLoadStyles(_fn: any): void {
  // no-op
}

/** Stub — sync/async mode selection. */
export function configureRunMode(_mode: any): void {
  // no-op
}

/** Stub — no buffering in sync mode. */
export function flush(): void {
  // no-op
}

/** Resolves theme tokens in a string without side effects. */
export function detokenize(input: string): string {
  return resolveTokens(input);
}

/** Splits a CSS string into themable chunks (stub — returns a single raw-string chunk). */
export function splitStyles(input: string): any[] {
  return [{ rawString: input }];
}

/**
 * The full module object — registered as the AMD module `@microsoft/load-themed-styles`
 * by `initializeSpfxMocks` so web-part bundles that depend on it get this implementation.
 */
export const loadThemedStylesModule = {
  loadStyles,
  loadTheme,
  clearStyles,
  configureLoadStyles,
  configureRunMode,
  flush,
  detokenize,
  splitStyles,
};
