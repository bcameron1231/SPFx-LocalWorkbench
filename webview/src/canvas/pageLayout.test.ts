import { describe, expect, it } from 'vitest';

import {
  addSection,
  canAddSection,
  changeSectionLayout,
  createPageLayout,
  moveSection,
  orderedWebParts,
  placeWebPart,
  reconcileLayout,
  removeSection,
} from './pageLayout';

describe('pageLayout', () => {
  it('starts with one "One column" section', () => {
    const page = createPageLayout();
    expect(page.sections).toHaveLength(1);
    expect(page.sections[0].layout).toBe('oneColumn');
    expect(page.sections[0].columns).toEqual([[]]);
  });

  it('keeps vertical and full-width sections apart, like SharePoint', () => {
    const withFullWidth = addSection(createPageLayout(), 1, 'fullWidth');
    expect(canAddSection(withFullWidth, 'vertical')).toBe(false);

    const withVertical = addSection(createPageLayout(), 0, 'vertical');
    expect(canAddSection(withVertical, 'fullWidth')).toBe(false);
    expect(canAddSection(withVertical, 'vertical')).toBe(false);
    expect(addSection(withVertical, 0, 'vertical')).toBe(withVertical);
  });

  it('always puts the vertical section last', () => {
    let page = addSection(createPageLayout(), 1, 'vertical');
    page = addSection(page, 5, 'twoColumns');
    expect(page.sections.map((s) => s.layout)).toEqual(['oneColumn', 'twoColumns', 'vertical']);
  });

  it('moves web parts from removed columns into the last remaining column', () => {
    let page = addSection(createPageLayout(), 0, 'threeColumns');
    const id = page.sections[0].id;
    page = placeWebPart(page, id, 0, 0, 'a');
    page = placeWebPart(page, id, 1, 0, 'b');
    page = placeWebPart(page, id, 2, 0, 'c');
    page = changeSectionLayout(page, id, 'twoColumns');
    expect(page.sections[0].columns).toEqual([['a'], ['b', 'c']]);
  });

  it('moves a web part instead of duplicating it', () => {
    let page = createPageLayout();
    const id = page.sections[0].id;
    page = placeWebPart(page, id, 0, 0, 'a');
    page = placeWebPart(page, id, 0, 5, 'a');
    expect(orderedWebParts(page)).toEqual(['a']);
  });

  it('returns the web parts of a removed section and keeps one section on the page', () => {
    let page = createPageLayout();
    page = placeWebPart(page, page.sections[0].id, 0, 0, 'a');
    const result = removeSection(page, page.sections[0].id);
    expect(result.removed).toEqual(['a']);
    expect(result.page.sections).toHaveLength(1);
  });

  it('does not move sections past the vertical section', () => {
    let page = addSection(createPageLayout(), 1, 'vertical');
    const first = page.sections[0].id;
    expect(moveSection(page, first, 1)).toBe(page);
    page = addSection(page, 1, 'twoColumns');
    expect(moveSection(page, first, 1).sections.map((s) => s.layout)).toEqual([
      'twoColumns',
      'oneColumn',
      'vertical',
    ]);
  });

  it('adds web parts that have no place yet and keeps the ones still loading', () => {
    let page = createPageLayout();
    page = placeWebPart(page, page.sections[0].id, 0, 0, 'loading');
    const result = reconcileLayout(page, ['x', 'loading']);
    expect(orderedWebParts(result)).toEqual(['loading', 'x']);
    expect(reconcileLayout(result, ['x', 'loading'])).toBe(result);
    expect(orderedWebParts(reconcileLayout(undefined, ['x']))).toEqual(['x']);
  });
});
