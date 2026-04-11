/**
 * Metadata describing the searchability and link-crawlability of web part properties (SPFx 1.12+).
 *
 * Modelled after the `propertiesMetadata` property in
 * client-side-web-part-manifest.schema.json.
 */
export interface IPropertiesMetadata {
  current: Record<string, unknown>;
}
