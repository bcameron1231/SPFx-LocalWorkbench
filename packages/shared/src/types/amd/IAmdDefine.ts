/**
 * AMD define function signature
 * Defines a module with optional dependencies
 */
export interface IAmdDefine {
  (moduleName: string, dependencies: string[], factory: (...args: any[]) => any): void;
  (moduleName: string, factory: () => any): void;
  (factory: () => any): void;
}
