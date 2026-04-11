/**
 * Flexible layout sizing for a web part on the modern page flexible canvas (SPFx 1.18+).
 *
 * Modelled after the `flexibleLayoutSizing` property in
 * client-side-web-part-manifest.schema.json.
 */
export interface IFlexibleLayoutSizing {
  /** If true the web part can resize to any width between min and max columns. */
  supportsDynamicResizing?: boolean;
  /** Default width in flexible layout columns. */
  defaultColumnWidth?: number;
  /** Default height in flexible layout rows. */
  defaultRowHeight?: number;
}
