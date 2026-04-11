import type { IScriptResourcePath } from './IScriptResourcePath';

/**
 * A module whose script file is provided by the component developer.
 * The `path` field is either a fully-qualified URL or a path relative to one
 * of the `internalModuleBaseUrls` entries.
 */
export interface IPathModuleResource {
  type: 'path';
  /** Path to the JavaScript file. */
  path: IScriptResourcePath;
  /**
   * Global variable name for non-AMD scripts.
   * When set the loader skips waiting for `define`/`require` and reads this
   * window-level variable after the script loads.
   */
  globalName?: string;
  /**
   * Names of other non-AMD modules in this component that must be loaded first.
   * Only applicable when `globalName` is set.
   */
  globalDependencies?: string[];
  /** If true, this module is not preloaded when the component is first loaded. */
  shouldNotPreload?: boolean;
}
