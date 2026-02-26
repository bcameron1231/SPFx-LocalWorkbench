import { DEFAULT_THEME_NAME, MICROSOFT_THEMES } from '@spfx-local-workbench/shared';
import type { ITheme } from '@spfx-local-workbench/shared';
import { applyPaletteAsCssVars, buildFluentTheme } from '@spfx-local-workbench/shared/fluent';

/**
 * Provides theme services for SPFx web parts in the local workbench.
 *
 * Accepts an ITheme (the same type used throughout the extension and shared package)
 * and derives the correct Fluent UI theme object and CSS custom properties from it.
 */
export class ThemeProvider {
  private theme: ITheme;

  constructor(theme?: ITheme) {
    // Fall back to Teal from the shared MICROSOFT_THEMES constant so the workbench is never unthemed
    this.theme =
      theme ?? MICROSOFT_THEMES.find((t) => t.name === DEFAULT_THEME_NAME) ?? MICROSOFT_THEMES[0];
  }

  /**
   * Applies the full palette as CSS custom properties on a web part's container element.
   * All 30+ palette slots are set so SPFx web parts relying on any CSS var get the
   * correct value, not just the three that were previously injected.
   */
  applyThemeToWebPart(domElement: HTMLElement): void {
    applyPaletteAsCssVars(domElement, this.theme.palette);
  }

  /**
   * Returns a Fluent UI-compatible IReadonlyTheme to pass to `onThemeChanged`.
   * Built from the full IThemePalette — all neutral and semantic slots are correctly
   * derived from the selected theme
   */
  getTheme(): any {
    return buildFluentTheme(this.theme.palette, this.theme.isInverted);
  }
}
