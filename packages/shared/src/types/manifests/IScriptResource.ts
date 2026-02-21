import type { IFrameworkModuleResource } from './IFrameworkModuleResource';
import type { ILocalizedPathModuleResource } from './ILocalizedPathModuleResource';
import type { IPathModuleResource } from './IPathModuleResource';

/**
 * A script resource entry in a component's `loaderConfig.scriptResources` map.
 *
 * Modelled after the three discriminated variants defined in
 * client-side-component-loader-configuration.schema.json:
 *
 * - `'component'`     – provided by the SPFx framework runtime.
 * - `'path'`         – a single-file module provided by the developer.
 * - `'localizedPath'` – a locale-aware module provided by the developer.
 */
export type IScriptResource =
  | IFrameworkModuleResource
  | IPathModuleResource
  | ILocalizedPathModuleResource;
