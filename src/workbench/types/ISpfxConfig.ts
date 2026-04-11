/** SPFx project configuration (version 2.0) */
export interface ISpfxConfig {
  $schema?: string;
  version: string;
  bundles: Record<string, IBundleConfig>;
  externals?: Record<string, string | IExternalConfig>;
  localizedResources?: Record<string, string>;
  asyncComponents?: string[];
}

/** Bundle configuration */
export interface IBundleConfig {
  components: IComponentEntry[];
}

/** External bundle configuration (for non-AMD dependencies) */
export interface IExternalConfig {
  path: string;
  globalName: string;
  globalDependencies?: string[];
}

/** Component entry in bundle */
export interface IComponentEntry {
  entrypoint: string;
  manifest: string;
}
