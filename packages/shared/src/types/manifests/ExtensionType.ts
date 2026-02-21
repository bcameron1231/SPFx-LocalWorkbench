/**
 * Enumeration of SPFx extension sub-types.
 * Matches the `extensionType` enum in `client-side-extension-manifest.schema.json`.
 */
export type ExtensionType =
  | 'Unknown'
  | 'ApplicationCustomizer'
  | 'FieldCustomizer'
  | 'ListViewCommandSet'
  | 'SearchQueryModifier'
  | 'FormCustomizer';
