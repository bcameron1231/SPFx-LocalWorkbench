import { loadTheme as loadFluentUiTheme } from '@fluentui/react';
import { DEFAULT_THEME_NAME, MICROSOFT_THEMES, loadTheme } from '@spfx-local-workbench/shared';
import type { ITheme } from '@spfx-local-workbench/shared';
import { applyPaletteAsCssVars, buildFlatTheme, buildFluentTheme } from '@spfx-local-workbench/shared/fluent';

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
   * Applies the full palette as CSS custom properties on the document body so that
   * the workbench shell (background, etc.) reflects the active theme.
   */
  applyThemeToDocument(): void {
    applyPaletteAsCssVars(document.body, this.theme.palette, this.theme.isInverted);
    // Populate __themeState__.theme with the full flat theme (palette + semantic colors +
    // flattened font ramp + effects) matching what the online SharePoint workbench provides.
    loadTheme(buildFlatTheme(this.theme.palette, this.theme.isInverted));
    // Update @fluentui/react's global theme so the workbench chrome controls
    // (SearchBox, Dropdown, IconButton, etc.) render in the selected theme.
    loadFluentUiTheme(buildFluentTheme(this.theme.palette, this.theme.isInverted));
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
