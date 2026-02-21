import type { IClientSideComponentManifest } from './IClientSideComponentManifest';
import type { ExtensionType } from './ExtensionType';

/**
 * SPFx client-side extension manifest.
 * Models `client-side-extension-manifest.schema.json`.
 *
 * Extensions do NOT have `preconfiguredEntries` — they are loaded by the host
 * page rather than placed manually in the toolbox.
 *
 * Use the `extensionType` field to distinguish between the various extension
 * sub-types at runtime.
 */
export interface IExtensionManifest extends IClientSideComponentManifest {
  /** Always `'Extension'` for extension manifests. */
  componentType: 'Extension';

  /**
   * The sub-type of this extension.
   *
   * - `'ApplicationCustomizer'`  — runs on every page load via `UserCustomActions`.
   * - `'FieldCustomizer'`        — renders list column fields.
   * - `'ListViewCommandSet'`     — adds commands to list-view toolbars and menus.
   * - `'SearchQueryModifier'`    — modifies SharePoint search queries.
   * - `'FormCustomizer'`         — replaces the default list item form.
   * - `'Unknown'`                — fallback when the sub-type cannot be determined.
   */
  extensionType: ExtensionType;
}
