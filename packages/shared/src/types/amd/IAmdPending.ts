/**
 * Pending AMD callback queue
 * Stores callbacks for modules that are being loaded
 */
export interface IAmdPending {
  [moduleName: string]: Array<(module: any) => void>;
}
