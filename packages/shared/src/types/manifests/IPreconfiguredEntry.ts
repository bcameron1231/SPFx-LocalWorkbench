import type { ILocalizedString } from '../ILocalizedString';

/**
 * A single pre-configured toolbox entry for a web part.
 *
 * Modelled after the `preconfiguredEntries` item schema defined in
 * client-side-web-part-manifest.schema.json.
 *
 * Each entry corresponds to one listing in the modern SharePoint toolbox / add panel.
 * A manifest must have at least one entry; having multiple entries lets a single web
 * part expose several pre-configured variants (e.g. different default property sets).
 *
 * The schema requires that at least one of `officeFabricIconFontName`, `iconImageUrl`,
 * or `fullPageAppIconImageUrl` is provided together with `title`, `description`,
 * `groupId`, and `properties`.
 */
export interface IPreconfiguredEntry {
  /**
   * Localised display title shown in the toolbox.
   * Must contain a 'default' key.
   */
  title: ILocalizedString;

  /**
   * Localised description shown as a tooltip in the toolbox.
   * Must contain a 'default' key.
   */
  description: ILocalizedString;

  /**
   * Name of an icon from the Office UI Fabric / Fluent UI icon font.
   * When set, `iconImageUrl` is ignored.
   * See https://aka.ms/uifabric-icons for available names.
   */
  officeFabricIconFontName?: string;

  /**
   * URL of a 38×38 px bitmap icon.
   * Used when `officeFabricIconFontName` is not set.
   */
  iconImageUrl?: string;

  /**
   * URL of the ~195×110 px icon shown on Application pages in the new Page experience.
   * Falls back to `iconImageUrl` when absent.
   */
  fullPageAppIconImageUrl?: string;

  /**
   * GUID that identifies the toolbox group for the modern page.
   * Must be one of the predefined SharePoint group GUIDs or any custom GUID
   * (falls back to the 'Other' group).
   */
  groupId: string;

  /**
   * Localised group name shown in the classic-page toolbox.
   * Falls back to 'Miscellaneous' when absent.
   */
  group?: ILocalizedString;

  /**
   * Up to 10 localised tags used for categorisation and search in the toolbox.
   */
  tags?: ILocalizedString[];

  /** Default property values applied when the web part is added to a page. */
  properties?: Record<string, unknown>;

  /**
   * Optional data version for this preconfigured entry.
   * Useful when the SPPKG is updated independently from the code (e.g. CDN-hosted)
   * and the web part needs backward compatibility with outdated default properties.
   */
  dataVersion?: string;
}
