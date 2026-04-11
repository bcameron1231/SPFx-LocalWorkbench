/**
 * AMD require function signature
 * Loads modules asynchronously
 */
export interface IAmdRequire {
  (dependencies: string[], callback: (...args: any[]) => void): void;
  (moduleName: string): any;
}
