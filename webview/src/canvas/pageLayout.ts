/**
 * Page layout for the SharePoint canvas mode: sections hold columns, columns hold web parts
 * (by instance ID). Widths follow the SharePoint page grid; see docs/sharepoint-canvas-measurements.md.
 *
 * All functions are pure: they return a new layout and never change the one passed in.
 */

export type SectionLayout =
  | 'oneColumn'
  | 'twoColumns'
  | 'threeColumns'
  | 'oneThirdLeft'
  | 'oneThirdRight'
  | 'fullWidth'
  | 'vertical';

/** SharePoint's data-theme-emphasis: 0 light section, 3 dark section (light text) */
export type SectionEmphasis = 0 | 1 | 2 | 3;

/** A colour of the site theme: white, the primary colour or the second brand colour */
export type SectionColorSlot = 'white' | 'primary' | 'secondary';

export type SectionFillMode = 'cover' | 'contain' | 'tile' | 'original';
export type SectionOverlayType = 'white' | 'black' | 'lightGradient' | 'darkGradient';
export type SectionGradientDirection = 'toBottom' | 'toTop' | 'toRight' | 'toLeft';

/** The Design tab of SharePoint's Section pane */
export interface ISectionDesign {
  /** Theme colours: [background, accent] */
  colors?: [SectionColorSlot, SectionColorSlot];
  background?: {
    /** One of the workbench gradient presets */
    presetId?: string;
    /** Or an image URL */
    url?: string;
    /** For images: whether they are dark (light text) */
    dark?: boolean;
    fill?: SectionFillMode;
    /** Focal point, 0-100 % */
    focalX?: number;
    focalY?: number;
  };
  overlay?: {
    type: SectionOverlayType;
    direction?: SectionGradientDirection;
    /** 0-100 */
    opacity: number;
  };
}

export interface ISection {
  id: string;
  layout: SectionLayout;
  /** Older saved layouts: 3 was the "Strong" background */
  emphasis?: SectionEmphasis;
  design?: ISectionDesign;
  /** Web part instance IDs per column, top to bottom */
  columns: string[][];
}

export interface IPageLayout {
  sections: ISection[];
}

/** Column spans on SharePoint's 12-column grid */
export const COLUMN_SPANS: Record<SectionLayout, number[]> = {
  oneColumn: [12],
  twoColumns: [6, 6],
  threeColumns: [4, 4, 4],
  oneThirdLeft: [4, 8],
  oneThirdRight: [8, 4],
  fullWidth: [12],
  vertical: [12],
};

/** Layouts a section can switch between (full-width and vertical are fixed when added) */
export const COLUMN_LAYOUTS: SectionLayout[] = [
  'oneColumn',
  'twoColumns',
  'threeColumns',
  'oneThirdLeft',
  'oneThirdRight',
];

let sectionCounter = 0;

export function createSection(layout: SectionLayout = 'oneColumn'): ISection {
  return {
    id: `section-${Date.now()}-${++sectionCounter}`,
    layout,
    columns: COLUMN_SPANS[layout].map(() => []),
  };
}

/** A new page: one "One column" section, as SharePoint starts */
export function createPageLayout(): IPageLayout {
  return { sections: [createSection('oneColumn')] };
}

export function getVerticalSection(page: IPageLayout): ISection | undefined {
  return page.sections.find((section) => section.layout === 'vertical');
}

/**
 * Whether a section with this layout can be added. As on SharePoint, a page has at most one vertical
 * section, and vertical and full-width sections can't be on the same page.
 */
export function canAddSection(page: IPageLayout, layout: SectionLayout): boolean {
  const hasVertical = !!getVerticalSection(page);
  if (layout === 'vertical') {
    return !hasVertical && !page.sections.some((section) => section.layout === 'fullWidth');
  }
  if (layout === 'fullWidth') {
    return !hasVertical;
  }
  return true;
}

/** Inserts a section at a position among the horizontal sections. The vertical section always goes last. */
export function addSection(page: IPageLayout, index: number, layout: SectionLayout): IPageLayout {
  if (!canAddSection(page, layout)) {
    return page;
  }
  const section = createSection(layout);
  const sections = [...page.sections];
  if (layout === 'vertical') {
    sections.push(section);
  } else {
    sections.splice(Math.max(0, Math.min(index, sections.length)), 0, section);
  }
  return { sections: keepVerticalLast(sections) };
}

/** Removes a section. Its web parts are returned so the caller can dispose of them. */
export function removeSection(
  page: IPageLayout,
  sectionId: string,
): { page: IPageLayout; removed: string[] } {
  const section = page.sections.find((s) => s.id === sectionId);
  if (!section) {
    return { page, removed: [] };
  }
  const sections = page.sections.filter((s) => s.id !== sectionId);
  return {
    page: { sections: sections.length > 0 ? sections : [createSection('oneColumn')] },
    removed: section.columns.flat(),
  };
}

/** Moves a horizontal section up (-1) or down (+1) */
export function moveSection(page: IPageLayout, sectionId: string, direction: -1 | 1): IPageLayout {
  const sections = [...page.sections];
  const index = sections.findIndex((s) => s.id === sectionId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= sections.length) {
    return page;
  }
  if (sections[index].layout === 'vertical' || sections[target].layout === 'vertical') {
    return page;
  }
  [sections[index], sections[target]] = [sections[target], sections[index]];
  return { sections };
}

/**
 * Changes the columns of a section. Web parts in columns that no longer exist move to the end of the
 * last remaining column, as on SharePoint.
 */
export function changeSectionLayout(
  page: IPageLayout,
  sectionId: string,
  layout: SectionLayout,
): IPageLayout {
  if (!COLUMN_LAYOUTS.includes(layout)) {
    return page;
  }
  return mapSection(page, sectionId, (section) => {
    if (!COLUMN_LAYOUTS.includes(section.layout)) {
      return section;
    }
    const count = COLUMN_SPANS[layout].length;
    const columns = COLUMN_SPANS[layout].map((_, i) => [...(section.columns[i] ?? [])]);
    for (let i = count; i < section.columns.length; i++) {
      columns[count - 1].push(...section.columns[i]);
    }
    return { ...section, layout, columns };
  });
}

export function setSectionDesign(
  page: IPageLayout,
  sectionId: string,
  design: ISectionDesign,
): IPageLayout {
  return mapSection(page, sectionId, (section) => ({ ...section, design, emphasis: undefined }));
}

/** A section's design, reading the older "emphasis" backgrounds too */
export function getSectionDesign(section: ISection | undefined): ISectionDesign | undefined {
  if (section?.design) {
    return section.design;
  }
  return section?.emphasis === 3 ? { colors: ['primary', 'white'] } : undefined;
}

/** Puts a web part in a column at a position (removing it from where it was) */
export function placeWebPart(
  page: IPageLayout,
  sectionId: string,
  columnIndex: number,
  position: number,
  instanceId: string,
): IPageLayout {
  const without = removeWebPart(page, instanceId);
  return mapSection(without, sectionId, (section) => {
    const columns = section.columns.map((column) => [...column]);
    const column = columns[Math.min(columnIndex, columns.length - 1)];
    column.splice(Math.max(0, Math.min(position, column.length)), 0, instanceId);
    return { ...section, columns };
  });
}

export function removeWebPart(page: IPageLayout, instanceId: string): IPageLayout {
  return {
    sections: page.sections.map((section) => ({
      ...section,
      columns: section.columns.map((column) => column.filter((id) => id !== instanceId)),
    })),
  };
}

/** The section a web part is in */
export function findWebPartSection(page: IPageLayout, instanceId: string): ISection | undefined {
  return page.sections.find((section) =>
    section.columns.some((column) => column.includes(instanceId)),
  );
}

/**
 * Adds web parts that have no place yet (e.g. added in the free canvas) to the end of the first section.
 * IDs of web parts that aren't on the canvas are kept: they may still be loading. Deleting a web part
 * removes it from the layout explicitly (removeWebPart).
 */
export function reconcileLayout(page: IPageLayout | undefined, instanceIds: string[]): IPageLayout {
  let result: IPageLayout = page?.sections?.length ? page : createPageLayout();

  const placed = new Set(result.sections.flatMap((section) => section.columns.flat()));
  const first =
    result.sections.find((section) => section.layout !== 'vertical') ?? result.sections[0];
  for (const id of instanceIds) {
    if (!placed.has(id)) {
      result = placeWebPart(result, first.id, 0, Number.MAX_SAFE_INTEGER, id);
    }
  }
  return result;
}

/** Web part instance IDs in reading order (sections top to bottom, columns left to right) */
export function orderedWebParts(page: IPageLayout): string[] {
  return page.sections.flatMap((section) => section.columns.flat());
}

function mapSection(
  page: IPageLayout,
  sectionId: string,
  update: (section: ISection) => ISection,
): IPageLayout {
  return {
    sections: page.sections.map((section) =>
      section.id === sectionId ? update(section) : section,
    ),
  };
}

function keepVerticalLast(sections: ISection[]): ISection[] {
  return [
    ...sections.filter((section) => section.layout !== 'vertical'),
    ...sections.filter((section) => section.layout === 'vertical'),
  ];
}
