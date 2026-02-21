import type { IWebPartManifest } from '@spfx-local-workbench/shared';

/** Workbench configuration */
export interface IWorkbenchConfig {
  serveUrl: string;
  webParts: IWebPartManifest[];
  nonce: string;
  cspSource: string;
}
