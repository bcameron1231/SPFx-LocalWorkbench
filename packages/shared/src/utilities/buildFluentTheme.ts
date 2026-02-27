import { createTheme } from '@fluentui/react';

import type { IThemePalette } from '../types';

/**
 * Builds a Fluent UI v8-compatible IReadonlyTheme from an IThemePalette.
 *
 * Merges the provided palette over DefaultPalette so all ~57 palette slots
 * are populated, and derives all ~103 semantic color slots, fonts, and effects.
 *
 * Use the returned theme object directly with Fluent UI's `loadTheme()` to update
 * the control renderer, or pass it to `buildFlatTheme()` to produce the flat
 * object expected by `window.__themeState__`.
 *
 * @param palette - The configured SharePoint/SPFx palette (30+ color tokens)
 * @param isInverted - Whether this is a dark/inverted theme
 * @returns A Fluent UI ITheme (palette, semanticColors, fonts, effects, spacing)
 */
export function buildFluentTheme(palette: IThemePalette, isInverted: boolean = false): any {
  return createTheme({ palette, isInverted });
}

/**
 * Produces the flat theme object that SharePoint stores in
 * `window.__themeState__.theme` — the authoritative source SPFx web parts read
 * when resolving `[theme:token, default:#value]` tokens in their CSS.
 *
 * The flat object is a full merge of:
 *   • All ~57 palette slots    (themePrimary, neutral*, color aliases like yellow/red/blue…)
 *   • All ~103 semantic colors (bodyBackground, buttonText, errorText…)
 *   • All font slots flattened (tinyFontFamily, tinyFontSize, mediumFontWeight…)
 *   • All effect slots         (elevation4–64, roundedCorner2/4/6, cardShadow)
 *
 * This produces a structure equivalent to what the online SharePoint workbench
 * exposes for the same palette, giving SPFx web-part code the exact token set
 * it expects regardless of which web part framework version it uses.
 *
 * @param palette - The configured SharePoint/SPFx palette
 * @param isInverted - Whether this is a dark/inverted theme
 * @returns A flat key→value map ready for assignment to `__themeState__.theme`
 */
export function buildFlatTheme(
  palette: IThemePalette,
  isInverted: boolean = false,
): Record<string, string | number> {
  const theme = buildFluentTheme(palette, isInverted);
  const flat: Record<string, string | number> = {};

  // Palette: DefaultPalette merged with the input palette (~57 keys).
  // Contains all standard Fluent UI color aliases as well as the inverted neutral
  // ramp for dark themes (white ↔ black effectively swapped by the caller's input).
  Object.assign(flat, theme.palette);

  // Semantic colors (~103 computed keys): body/button/input/list/menu backgrounds
  // and text colours, error/warning/info backgrounds, etc.
  Object.assign(flat, theme.semanticColors);

  // Fonts: flatten { tiny: { fontFamily, fontSize, fontWeight, ... }, xSmall: {…}, … }
  // into { tinyFontFamily, tinyFontSize, tinyFontWeight, xSmallFontFamily, … }.
  // This matches the key format present in SharePoint's __themeState__.theme.
  if (theme.fonts) {
    for (const [sizeKey, fontObj] of Object.entries(theme.fonts as Record<string, Record<string, string | number>>)) {
      for (const [propKey, propVal] of Object.entries(fontObj)) {
        if (propVal !== null && propVal !== undefined) {
          // e.g. "tiny" + "fontFamily" → "tinyFontFamily"
          const flatKey = `${sizeKey}${propKey.charAt(0).toUpperCase()}${propKey.slice(1)}`;
          flat[flatKey] = propVal;
        }
      }
    }
  }

  // Effects: elevation shadows + rounded corner radii.
  // cardShadow is a SP alias for elevation4.
  if (theme.effects) {
    Object.assign(flat, theme.effects);
    if (theme.effects.elevation4 && !('cardShadow' in flat)) {
      flat['cardShadow'] = theme.effects.elevation4;
    }
  }

  return flat;
}

// ─── CSS custom property helpers ────────────────────────────────────────────

/**
 * The CSS custom property names our own workbench and Storybook CSS files
 * consume.  We write exactly this set — and nothing more — onto `document.body`
 * so that theme switches keep our chrome (property pane, canvas background,
 * toolbar) in sync without polluting the inline style with hundreds of vars
 * that SPFx web parts never read from CSS custom properties.
 *
 * SPFx itself resolves theme tokens via `window.__themeState__.theme`, not CSS
 * custom properties.  Only our own CSS (global.css, PropertyPanePanel, etc.)
 * uses `var(--token, fallback)`, so a targeted write is both correct and clean.
 */
const OWN_CSS_VARS: ReadonlyArray<[cssVar: string, themeKey: string]> = [
  // Palette slots
  ['--themePrimary',     'themePrimary'],
  ['--themeDark',        'themeDark'],
  ['--neutralPrimary',   'neutralPrimary'],
  ['--neutralSecondary', 'neutralSecondary'],
  ['--neutralTertiary',  'neutralTertiary'],
  ['--neutralLight',     'neutralLight'],
  ['--neutralLighter',   'neutralLighter'],
  ['--neutralDark',      'neutralDark'],
  // Semantic color slots
  ['--errorBackground',  'errorBackground'],
  ['--errorText',        'errorText'],
];

/**
 * Applies the workbench/Storybook-specific CSS custom properties to a DOM element.
 *
 * Writes ONLY the vars consumed by our own CSS files (global.css, PropertyPanePanel,
 * ExtensionPropertiesPanel, ComponentPicker, preview.css, withSpfx.module.css).
 * SPFx web parts do NOT read CSS custom properties — they read
 * `window.__themeState__.theme` which is populated separately by `loadTheme()`.
 *
 * The `--primaryBackground` var is also written here because it is a SharePoint-
 * specific token absent from Fluent UI's type system.  It is derived from the
 * `white` palette slot (the "page background" of the current theme — dark for
 * inverted themes, light for standard ones).
 *
 * Clearing: all `--*` properties already on the element are removed before writing
 * so that stale vars from a previous theme cannot bleed through.
 *
 * @param domElement - The container element (typically document.body)
 * @param palette - The configured SharePoint/SPFx palette to derive from
 * @param isInverted - Whether this is a dark/inverted theme
 */
export function applyPaletteAsCssVars(
  domElement: HTMLElement,
  palette: IThemePalette,
  isInverted: boolean = false,
): void {
  const theme = buildFluentTheme(palette, isInverted);
  const p = theme.palette as Record<string, string>;
  const s = theme.semanticColors as Record<string, string>;
  // Single flat lookup map for both palette and semantic color slots.
  const flat: Record<string, string> = { ...p, ...s };

  // Clear all existing --* vars on this element (snapshot required; live
  // CSSStyleDeclaration skips entries if mutated during iteration).
  const existingVars = Array.from(domElement.style).filter((n) => n.startsWith('--'));
  for (const name of existingVars) domElement.style.removeProperty(name);

  // Write only the vars our own CSS files consume.
  for (const [cssVar, themeKey] of OWN_CSS_VARS) {
    const value = flat[themeKey];
    if (value) domElement.style.setProperty(cssVar, value);
  }

  // --primaryBackground is the "page background" slot used by preview.css,
  // withSpfx.module.css, and the workbench panels.  SharePoint sets it to the
  // theme's `white` palette slot (which is the dark grey for dark themes).
  // If the caller's palette supplies it explicitly (MICROSOFT_THEMES all do),
  // use that; otherwise fall back to the derived `white` slot.
  const primaryBackground = (palette as Record<string, string>)['primaryBackground'] ?? p.white;
  if (primaryBackground) domElement.style.setProperty('--primaryBackground', primaryBackground);

  domElement.style.fontFamily =
    "'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif";
}

