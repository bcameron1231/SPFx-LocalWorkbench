import type { IScriptResourcePath } from './IScriptResourcePath';

/**
 * A framework-supplied module provided by the SPFx runtime.
 * Keys in `scriptResources` that reference framework modules must use the
 * canonical framework library name (e.g. '@microsoft/sp-core-library').
 */
export interface IFrameworkModuleResource {
  type: 'component';
  /** Version of the framework component to load (semver or 'latest'). */
  version: string;
  /** GUID of the framework component. */
  id: string;
  /**
   * Fallback path used when the requested version is unavailable in the framework
   * runtime. Must be a fully-qualified URL or a path under `internalModuleBaseUrls`.
   */
  failoverPath?: IScriptResourcePath;
  /** If true, this module is not preloaded when the component is first loaded. */
  shouldNotPreload?: boolean;
}
