/**
 * Section design: theme colours, backgrounds and overlays, as in SharePoint's Section > Design pane
 * (see docs/sharepoint-canvas-measurements.md).
 *
 * - Theme colours are background/accent pairs built from the site theme's primary colour and its
 *   second brand colour (the palette's `accent` slot, when it differs from the primary). The web parts
 *   in the section get a theme generated from the pair (SPFx theme variants).
 * - Backgrounds are an image (any URL) or one of the workbench's own gradient presets, with a fill mode,
 *   a focal point and an overlay (white, black, or a white/black gradient) of adjustable opacity.
 *   Dark backgrounds switch the section to light text, as SharePoint does (data-theme-emphasis="3").
 */
import {
  BaseSlots,
  ThemeGenerator,
  getColorFromString,
  themeRulesStandardCreator,
} from '@fluentui/react';
import type { CSSProperties } from 'react';

import type { IThemePalette } from '@spfx-local-workbench/shared';

import type { ISectionDesign, SectionColorSlot, SectionEmphasis } from './pageLayout';

export interface ISectionPalette {
  palette: IThemePalette;
  isInverted: boolean;
}

/** Theme colour pairs in SharePoint's order: [background, accent] */
export const THEME_COLOR_PAIRS: [SectionColorSlot, SectionColorSlot][] = [
  ['white', 'primary'],
  ['primary', 'white'],
  ['white', 'secondary'],
  ['secondary', 'white'],
  ['secondary', 'primary'],
  ['primary', 'secondary'],
];

export interface IBackgroundPreset {
  id: string;
  label: string;
  /** CSS background-image */
  image: string;
  /** Dark backgrounds get light text and a black overlay by default */
  dark: boolean;
  overlayOpacity: number;
}

/**
 * The workbench's own gradient backgrounds. SharePoint's gallery images are Microsoft assets served from
 * the tenant, so they aren't bundled; use "Add a background" with an image URL for real images.
 */
export const BACKGROUND_PRESETS: IBackgroundPreset[] = [
  {
    id: 'peach-blue',
    label: 'Peach fading to blue',
    image: 'linear-gradient(135deg, #fbd3c4 0%, #e9e4f3 55%, #c9dcf5 100%)',
    dark: false,
    overlayOpacity: 0,
  },
  {
    id: 'mint-green',
    label: 'Mint fading to green',
    image: 'linear-gradient(135deg, #c8f1ec 0%, #d9f5d3 60%, #b7e3c0 100%)',
    dark: false,
    overlayOpacity: 0,
  },
  {
    id: 'lavender',
    label: 'Light blue fading to lavender',
    image: 'linear-gradient(135deg, #eef2fb 0%, #e3e1f7 100%)',
    dark: false,
    overlayOpacity: 0,
  },
  {
    id: 'night-purple',
    label: 'Dark blue fading to purple',
    image: 'linear-gradient(135deg, #0d1a4a 0%, #2b1460 60%, #5a1f7a 100%)',
    dark: true,
    overlayOpacity: 20,
  },
  {
    id: 'teal-green',
    label: 'Dark teal fading to green',
    image: 'linear-gradient(135deg, #0f3d57 0%, #155e63 60%, #2b7a4b 100%)',
    dark: true,
    overlayOpacity: 20,
  },
  {
    id: 'sand-plum',
    label: 'Sand fading to plum',
    image: 'linear-gradient(135deg, #b9a27d 0%, #6c4e6f 70%, #3b2346 100%)',
    dark: true,
    overlayOpacity: 30,
  },
  {
    id: 'silver-wave',
    label: 'Silver waves',
    image:
      'radial-gradient(120% 80% at 0% 100%, #d7dbe3 0%, transparent 60%), linear-gradient(160deg, #f7f8fa 0%, #e6e9ef 100%)',
    dark: false,
    overlayOpacity: 0,
  },
  {
    id: 'warm-glow',
    label: 'Warm glow',
    image:
      'radial-gradient(60% 90% at 70% 40%, #ffe3b0 0%, transparent 70%), linear-gradient(180deg, #fff8ec 0%, #f6dfc0 100%)',
    dark: false,
    overlayOpacity: 40,
  },
  {
    id: 'graphite',
    label: 'Graphite',
    image:
      'radial-gradient(80% 120% at 20% 0%, #4a4a4a 0%, transparent 70%), linear-gradient(180deg, #2b2b2b 0%, #121212 100%)',
    dark: true,
    overlayOpacity: 38,
  },
  {
    id: 'forest',
    label: 'Forest green',
    image: 'linear-gradient(135deg, #0f3b1e 0%, #2f7a3a 60%, #8bc34a 100%)',
    dark: true,
    overlayOpacity: 30,
  },
  {
    id: 'ocean',
    label: 'Deep ocean',
    image:
      'radial-gradient(70% 90% at 80% 20%, #1e5aa8 0%, transparent 70%), linear-gradient(180deg, #0b2447 0%, #061529 100%)',
    dark: true,
    overlayOpacity: 60,
  },
  {
    id: 'blush',
    label: 'Blush',
    image: 'linear-gradient(135deg, #fde2e4 0%, #fad2e1 50%, #e2ece9 100%)',
    dark: false,
    overlayOpacity: 0,
  },
];

const GRADIENT_DIRECTIONS = {
  toBottom: 'to bottom',
  toTop: 'to top',
  toRight: 'to right',
  toLeft: 'to left',
} as const;

const FILL_MODES = {
  cover: { backgroundSize: 'cover', backgroundRepeat: 'no-repeat' },
  contain: { backgroundSize: 'contain', backgroundRepeat: 'no-repeat' },
  tile: { backgroundSize: 'auto', backgroundRepeat: 'repeat' },
  original: { backgroundSize: 'auto', backgroundRepeat: 'no-repeat' },
} as const;

/** The palette's second brand colour, when the theme has one */
export function getSecondaryColor(palette: IThemePalette): string | undefined {
  const accent = palette.accent;
  return accent && accent.toLowerCase() !== palette.themePrimary.toLowerCase() ? accent : undefined;
}

function slotColor(palette: IThemePalette, slot: SectionColorSlot): string {
  switch (slot) {
    case 'primary':
      return palette.themePrimary;
    case 'secondary':
      return getSecondaryColor(palette) ?? palette.themePrimary;
    default:
      return '#ffffff';
  }
}

export function getPreset(design: ISectionDesign | undefined): IBackgroundPreset | undefined {
  return design?.background?.presetId
    ? BACKGROUND_PRESETS.find((p) => p.id === design.background?.presetId)
    : undefined;
}

/** Whether the section has a dark background (light text, data-theme-emphasis="3") */
export function isDarkSection(design: ISectionDesign | undefined): boolean {
  if (design?.background) {
    const overlay = design.overlay;
    if (overlay && overlay.opacity >= 50) {
      return overlay.type === 'black' || overlay.type === 'darkGradient';
    }
    return getPreset(design)?.dark ?? design.background.dark ?? false;
  }
  return (design?.colors?.[0] ?? 'white') !== 'white';
}

export function getSectionEmphasis(design: ISectionDesign | undefined): SectionEmphasis {
  return isDarkSection(design) ? 3 : 0;
}

/** Whether the design changes nothing (plain section in the site theme) */
export function isDefaultDesign(design: ISectionDesign | undefined): boolean {
  return (
    !design?.background &&
    (!design?.colors || (design.colors[0] === 'white' && design.colors[1] === 'primary'))
  );
}

/**
 * The palette web parts in the section get: generated from the section's background and accent colours
 * with Fluent's theme generator.
 */
export function getSectionPalette(
  palette: IThemePalette,
  isInverted: boolean,
  design: ISectionDesign | undefined,
): ISectionPalette {
  if (isDefaultDesign(design)) {
    return { palette, isInverted };
  }
  const [backgroundSlot, accentSlot] = design?.colors ?? ['white', 'primary'];
  const dark = isDarkSection(design);
  const background = design?.background
    ? dark
      ? '#1b1a19'
      : palette.white
    : slotColor(palette, backgroundSlot);
  const accent = slotColor(palette, accentSlot);
  const generated = generatePalette(
    accent,
    dark ? '#ffffff' : palette.neutralPrimary,
    background,
    dark,
  );
  return {
    palette: {
      ...palette,
      ...generated,
      // Over an image, web parts keep the section's background visible
      primaryBackground: design?.background ? 'transparent' : background,
      primaryText: generated.neutralPrimary,
      accent,
    } as IThemePalette,
    isInverted: dark,
  };
}

function generatePalette(
  primary: string,
  foreground: string,
  background: string,
  isInverted: boolean,
): Record<string, string> {
  const rules = themeRulesStandardCreator();
  ThemeGenerator.insureSlots(rules, isInverted);
  ThemeGenerator.setSlot(
    rules[BaseSlots[BaseSlots.primaryColor]],
    toColor(primary),
    isInverted,
    true,
    true,
  );
  ThemeGenerator.setSlot(
    rules[BaseSlots[BaseSlots.foregroundColor]],
    toColor(foreground),
    isInverted,
    true,
    true,
  );
  ThemeGenerator.setSlot(
    rules[BaseSlots[BaseSlots.backgroundColor]],
    toColor(background),
    isInverted,
    true,
    true,
  );
  return ThemeGenerator.getThemeAsJson(rules) as Record<string, string>;
}

function toColor(value: string) {
  return getColorFromString(value) ?? getColorFromString('#000000')!;
}

/** CSS for the section element's own background (image or preset) */
export function getSectionBackgroundStyle(design: ISectionDesign | undefined): CSSProperties {
  const background = design?.background;
  if (!background) {
    return {};
  }
  const image =
    getPreset(design)?.image ??
    (background.url ? `url("${background.url.replace(/"/g, '%22')}")` : undefined);
  if (!image) {
    return {};
  }
  const fill = FILL_MODES[background.fill ?? 'cover'];
  return {
    backgroundImage: image,
    backgroundSize: fill.backgroundSize,
    backgroundRepeat: fill.backgroundRepeat,
    backgroundPosition: `${background.focalX ?? 50}% ${background.focalY ?? 50}%`,
  };
}

/** CSS for the overlay drawn between the background and the content */
export function getSectionOverlayStyle(
  design: ISectionDesign | undefined,
): CSSProperties | undefined {
  const overlay = design?.overlay;
  if (!design?.background || !overlay || overlay.opacity <= 0) {
    return undefined;
  }
  const color =
    overlay.type === 'black' || overlay.type === 'darkGradient' ? '0, 0, 0' : '255, 255, 255';
  const isGradient = overlay.type === 'lightGradient' || overlay.type === 'darkGradient';
  return {
    opacity: overlay.opacity / 100,
    ...(isGradient
      ? {
          backgroundImage: `linear-gradient(${GRADIENT_DIRECTIONS[overlay.direction ?? 'toBottom']}, rgb(${color}), rgba(${color}, 0))`,
        }
      : { backgroundColor: `rgb(${color})` }),
  };
}

/** Colours of a theme colour pair, for the swatches in the Design pane */
export function getPairColors(
  palette: IThemePalette,
  pair: [SectionColorSlot, SectionColorSlot],
): [string, string] {
  return [slotColor(palette, pair[0]), slotColor(palette, pair[1])];
}

type SectionThemeApplier = (element: HTMLElement, design: ISectionDesign | undefined) => void;
let sectionThemeApplier: SectionThemeApplier | undefined;
let currentPalette: IThemePalette | undefined;

/** The runtime registers how to theme a section element (it owns the current workbench theme) */
export function setSectionThemeApplier(applier: SectionThemeApplier, palette: IThemePalette): void {
  sectionThemeApplier = applier;
  currentPalette = palette;
  window.dispatchEvent(new CustomEvent('workbenchSectionThemeChanged'));
}

/** Sets a section element's CSS custom properties to its design's theme */
export function applySectionTheme(element: HTMLElement, design: ISectionDesign | undefined): void {
  sectionThemeApplier?.(element, design);
}

/** The current workbench palette, for previews in the Design pane */
export function getCurrentPalette(): IThemePalette | undefined {
  return currentPalette;
}
