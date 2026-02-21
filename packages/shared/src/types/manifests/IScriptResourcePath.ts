/**
 * A path value is either a plain string URL / relative path, or an object
 * that additionally carries a Subresource Integrity hash.
 */
export type IScriptResourcePath = string | { path: string; integrity?: string };
