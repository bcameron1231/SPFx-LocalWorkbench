import { createTheme } from '@fluentui/react';

import type { IThemePalette } from '../types';

/**
 * Builds a Fluent UI v8-compatible IReadonlyTheme from an IThemePalette.
 *
 * Delegates to `createTheme` from `@fluentui/react` so that all semantic colors,
 * fonts, effects, and spacing slots are derived correctly — consistent with what
 * SPFx and Fluent UI itself produce at runtime.
 *
 * `@fluentui/react` is loaded lazily at call time rather than at module init time
 * so that environments which only need other exports from this package (e.g. the
 * Storybook manager bundle) are not affected by its absence.
 *
 * @param palette - The full IThemePalette (30+ color tokens)
 * @param isInverted - Whether this is a dark/inverted theme (from ITheme.isInverted)
 * @returns A Fluent UI-compatible theme object (ITheme from @fluentui/react)
 */
export function buildFluentTheme(palette: IThemePalette, isInverted: boolean = false): any {
  return createTheme({ palette, isInverted });
}

/**
 * Applies all palette tokens as CSS custom properties on a DOM element.
 * Covers all 30+ palette slots so SPFx web parts using CSS vars get the full theme.
 *
 * @param domElement - The container element to apply vars to
 * @param palette - The palette to apply
 */
export function applyPaletteAsCssVars(domElement: HTMLElement, palette: IThemePalette): void {
  for (const [key, value] of Object.entries(palette)) {
    domElement.style.setProperty(`--${key}`, value);
  }
  // Set font family
  domElement.style.fontFamily =
    "'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif";
}
