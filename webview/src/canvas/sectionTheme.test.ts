import { describe, expect, it } from 'vitest';

import { MICROSOFT_THEMES } from '@spfx-local-workbench/shared';

import { getSectionDesign } from './pageLayout';
import {
  getSectionBackgroundStyle,
  getSectionEmphasis,
  getSectionOverlayStyle,
  getSectionPalette,
  isDefaultDesign,
} from './sectionTheme';

const palette = MICROSOFT_THEMES[0].palette;

describe('sectionTheme', () => {
  it('leaves the site theme alone for the default design', () => {
    expect(isDefaultDesign(undefined)).toBe(true);
    expect(isDefaultDesign({ colors: ['white', 'primary'] })).toBe(true);
    expect(getSectionPalette(palette, false, undefined).palette).toBe(palette);
  });

  it('gives a primary-background section light text and the primary colour as background', () => {
    const design = { colors: ['primary', 'white'] as ['primary', 'white'] };
    const result = getSectionPalette(palette, false, design);
    expect(result.isInverted).toBe(true);
    expect(result.palette.primaryBackground.toLowerCase()).toBe(palette.themePrimary.toLowerCase());
    expect(result.palette.neutralPrimary.toLowerCase()).toBe('#ffffff');
    expect(getSectionEmphasis(design)).toBe(3);
  });

  it('switches to light text for dark backgrounds and strong black overlays', () => {
    expect(getSectionEmphasis({ background: { presetId: 'graphite' } })).toBe(3);
    expect(getSectionEmphasis({ background: { presetId: 'blush' } })).toBe(0);
    expect(
      getSectionEmphasis({
        background: { url: 'https://x/y.png' },
        overlay: { type: 'black', opacity: 80 },
      }),
    ).toBe(3);
    expect(
      getSectionEmphasis({
        background: { url: 'https://x/y.png', dark: true },
        overlay: { type: 'white', opacity: 90 },
      }),
    ).toBe(0);
  });

  it('builds the background and overlay CSS', () => {
    const design = {
      background: { url: 'https://x/y.png', fill: 'tile' as const, focalX: 20, focalY: 80 },
      overlay: { type: 'darkGradient' as const, direction: 'toRight' as const, opacity: 40 },
    };
    expect(getSectionBackgroundStyle(design)).toEqual({
      backgroundImage: 'url("https://x/y.png")',
      backgroundSize: 'auto',
      backgroundRepeat: 'repeat',
      backgroundPosition: '20% 80%',
    });
    expect(getSectionOverlayStyle(design)).toEqual({
      opacity: 0.4,
      backgroundImage: 'linear-gradient(to right, rgb(0, 0, 0), rgba(0, 0, 0, 0))',
    });
    expect(
      getSectionOverlayStyle({ ...design, overlay: { type: 'white', opacity: 0 } }),
    ).toBeUndefined();
  });

  it('reads the older "Strong" sections as a primary background', () => {
    expect(getSectionDesign({ id: 's', layout: 'oneColumn', emphasis: 3, columns: [[]] })).toEqual({
      colors: ['primary', 'white'],
    });
  });
});
