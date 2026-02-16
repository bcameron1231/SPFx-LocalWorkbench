/**
 * Script resource definition
 * Describes a JavaScript file that needs to be loaded
 */
export interface IScriptResource {
  /**
   * Resource type
   * - 'path': Single file path
   * - 'localizedPath': Multiple locale-specific paths
   * - 'internal': SPFx internal dependency
   */
  type: 'path' | 'localizedPath' | 'internal' | string;

  /** Single file path (for type: 'path') */
  path?: string;

  /** Locale-specific paths (for type: 'localizedPath') */
  paths?: Record<string, string>;

  /** Default locale path (for type: 'localizedPath') */
  defaultPath?: string;
}
