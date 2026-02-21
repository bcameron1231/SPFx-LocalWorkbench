import type { IScriptResourcePath } from './IScriptResourcePath';

/**
 * A locale-sensitive module provided by the component developer.
 * Behaves like `IPathModuleResource` but the loader selects the locale-specific
 * path from `paths` (or falls back to `defaultPath`) based on the user's locale.
 */
export interface ILocalizedPathModuleResource {
  type: 'localizedPath';
  /**
   * Default locale path used when the user's locale does not match any entry in
   * `paths`. Either a fully-qualified URL or a path under `internalModuleBaseUrls`.
   */
  defaultPath: IScriptResourcePath;
  /**
   * Dictionary of locale keys ('ll-cc' format) to locale-specific paths.
   * The loader tries to match the user's locale against these keys first.
   */
  paths?: Record<string, IScriptResourcePath>;
  /** If true, this module is not preloaded when the component is first loaded. */
  shouldNotPreload?: boolean;
}
