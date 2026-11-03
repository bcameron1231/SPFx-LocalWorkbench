# SharePoint canvas measurements

Measured on 2026-10-27 in a SharePoint Online modern page in edit mode (Chrome, 1540px wide window, toolbox
closed), by reading computed styles and element sizes. The workbench's SharePoint layout mode is built from these
numbers; SharePoint's own stylesheets are not copied.

## Sections

| Element | Value |
|---|---|
| Section (`CanvasZone`) | padding `0 16px`; background from the section's theme colours |
| Section content (`CanvasZoneSectionContainer`) | max-width `1236px`, padding `16px 0`, centred |
| Column (`CanvasSection`) | padding `0 8px`; 12-column grid (`CanvasSection-xl4` = 4/12) |
| Web part (`ControlZone`) | padding `16px`, border-radius `4px` |
| Full-width section | no padding, no max-width: spans the whole canvas |

Column widths at the full 1236px content width (column padding included):

| Layout | Columns |
|---|---|
| One column | 1236 |
| Two columns | 618 / 618 |
| Three columns | 412 / 412 / 412 |
| One-third left | 412 / 824 |
| One-third right | 824 / 412 |
| Full-width | whole canvas, no padding |

Narrow windows: columns carry `CanvasSection-sm12` plus `CanvasSection-xl<n>`, i.e. the Fabric grid
breakpoint: below 1024px every column takes the full width (stacked). (Inferred from the class names; the window
could not be resized for a direct measurement.)

## Vertical section

- A right-hand column, `412px` wide (one third of 1236), next to all the other sections, running their full height.
- The other sections keep a 1236px box; their content is 1204px wide (1236 − 2 × 16px padding).
- Not available while the page has a full-width section (the menu greys it out), and vice versa.

## Edit mode chrome

Measured again on 2026-10-27 with a web part selected:

| Element | Value |
|---|---|
| Web part (`ControlZone`, `data-automation-id="CanvasControl"`) | padding `16px`, radius `4px`. The web part's element sits inside that padding |
| Web part toolbar | one bar, 8px in from the web part's left edge, its top 44px above the web part: white, radius `4px`, shadow `0 6.4px 14.4px rgba(0,0,0,.133), 0 1.2px 3.6px rgba(0,0,0,.11)`; 36 × 36px buttons with 20px icons in `#424242`: Move, Edit properties, Duplicate, Delete |
| Product action menus | Web parts that float their own menu above the web part usually position it from the closest `[data-automation-id="CanvasControl"]` (its top padding is 16px). The workbench gives each web part that element and padding, so such menus land where they do in SharePoint (about 40px above the web part, level with the toolbar) |
| Web part name chip | on hover, above the top-left corner: background `#323130`, white 12px text, radius 4px |
| Section toolbar | the same bar, 8px in from the section's top-left corner: Move, Edit properties, Duplicate, Delete, Design ideas |
| Add section button | 28px circle, theme primary, white "+", centred on the line between sections |
| Selected section | 1px outline |

## Section pane ("Section")

**Layout tab:** Columns (One, Two, Three, One-third left, One-third right) as icon tiles, "Convert to flexible
section", Alignment (Top, Center, Bottom), "Make this section collapsible".

**Design tab:**

- **Theme colors:** background/accent pairs from the site theme's two brand colours (here primary `#0008ff`,
  second `#02660c`): white/primary, primary/white, white/second, second/white, second/primary, primary/second.
  A coloured background gives the section light text (`data-theme-emphasis="3"`).
- **Background:** a gallery of 12 images (6 gradients, 6 photos) served by the tenant's media service, and
  "Add a background". With a background: Change background, Advanced editing, Remove background; **Fill mode**
  (Scale to fill, Scale to fit, Tile, Original size); **Edit focal point**; **Overlay color** (White, Black, Light
  gradient, Dark gradient); **Gradient direction** for gradients (Top to bottom, Bottom to top, Left to right,
  Right to left); **Overlay opacity** (0-100).
- The overlay is an absolutely positioned element over the section background: a solid colour, or
  `linear-gradient(<direction>, <colour>, transparent)`, with `opacity` = overlay opacity / 100.
- Each gallery image comes with an overlay: light images white (e.g. 84 % or 0 %), dark images black (38-60 %)
  and `data-theme-emphasis="3"` (white text).
- Theme colours don't replace a chosen background image.

What the workbench does differently:

- The gallery images are Microsoft assets served through the tenant, so they aren't bundled. The workbench has its
  own 12 CSS gradient presets, and "Add a background" takes any image URL (tenant images load through the proxy).
- "Advanced editing" (crop) and the drag-to-pick focal point editor are replaced by horizontal/vertical sliders.
- The second brand colour is the theme palette's `accent` slot when it differs from `themePrimary`; with one brand
  colour only the two primary pairs are shown.
- Web parts in a coloured section get a theme generated from the pair with Fluent's theme generator. SharePoint's
  exact generated variant was not compared slot by slot.
