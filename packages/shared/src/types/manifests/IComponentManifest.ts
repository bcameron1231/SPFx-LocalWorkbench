import type { IExtensionManifest } from './IExtensionManifest';
import type { IWebPartManifest } from './IWebPartManifest';

/** Convenience union of all first-class SPFx component manifest types. */
export type IComponentManifest = IWebPartManifest | IExtensionManifest;
