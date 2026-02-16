import type { IWebPartManifest } from '../types';
import type { IAmdModules } from '../types/amd';

/**
 * ComponentResolver
 * Resolves SPFx component classes from the AMD module registry
 *
 * NOTE: This class requires browser environment (window)
 */
export class ComponentResolver {
  /**
   * Find a component class in the AMD module registry
   * @param manifest - Component manifest
   * @param candidateModules - Optional array of module names to search (from bundle loading)
   * @returns Component class constructor or null if not found
   */
  findComponentClass(manifest: IWebPartManifest, candidateModules?: string[]): any {
    if (typeof window === 'undefined') {
      throw new Error('ComponentResolver requires browser environment');
    }

    const amdModules = (window as any).__amdModules;
    if (!amdModules) {
      return null;
    }

    const alias = manifest.alias;
    const manifestId = manifest.id;
    const version = manifest.version || '0.0.1';
    const entryModuleId = manifest.loaderConfig?.entryModuleId || alias;
    const componentType = manifest.componentType || 'WebPart';

    let componentClass = null;
    let foundModule = null;

    // Step 1: Try exact pattern matches
    const idWithVersion = `${manifestId}_${version}`;
    const searchPatterns = [idWithVersion, manifestId, entryModuleId, alias];

    for (const pattern of searchPatterns) {
      if (amdModules[pattern]) {
        foundModule = amdModules[pattern];
        break;
      }
    }

    // Step 2: Fuzzy pattern match as fallback
    if (!foundModule) {
      for (const [name, mod] of Object.entries(amdModules)) {
        if (name.includes(manifestId) || name.toLowerCase().includes(alias.toLowerCase())) {
          foundModule = mod;
          break;
        }
      }
    }

    // Step 3: Extract the component class from the module
    if (foundModule) {
      componentClass = this.extractClassFromModule(foundModule, alias, componentType);
    }

    // Step 4: Last resort - search for lifecycle methods
    if (!componentClass) {
      componentClass = this.searchModulesForComponent(amdModules, componentType, candidateModules);
    }

    return componentClass;
  }

  /**
   * Extract component class from a module object
   * @param mod - AMD module object
   * @param alias - Component alias
   * @param componentType - 'WebPart' or 'Extension'
   * @returns Component class or null
   */
  private extractClassFromModule(mod: any, alias: string, componentType: string): any {
    // Direct function export
    if (typeof mod === 'function') {
      return mod;
    }

    // Default export
    if (mod.default && typeof mod.default === 'function') {
      return mod.default;
    }

    // Named export with conventional name
    const conventionalName = alias + componentType;
    if (mod[conventionalName] && typeof mod[conventionalName] === 'function') {
      return mod[conventionalName];
    }

    // Search module exports for a class with expected lifecycle methods
    for (const [key, value] of Object.entries(mod)) {
      if (typeof value === 'function' && (value as any).prototype) {
        const proto = (value as any).prototype;

        // Check for component lifecycle methods
        if (componentType === 'WebPart') {
          if (typeof proto.render === 'function' || key.toLowerCase().includes('webpart')) {
            return value;
          }
        } else if (componentType === 'Extension') {
          if (
            typeof proto.onInit === 'function' ||
            key.toLowerCase().includes('extension') ||
            key.toLowerCase().includes('customizer')
          ) {
            return value;
          }
        }
      }
    }

    return null;
  }

  /**
   * Search AMD modules for a component class
   * @param amdModules - AMD module registry
   * @param componentType - 'WebPart' or 'Extension'
   * @param candidateModules - Optional array of module names to limit search
   * @returns Component class or null
   */
  private searchModulesForComponent(
    amdModules: IAmdModules,
    componentType: string,
    candidateModules?: string[],
  ): any {
    // If candidateModules provided, search only those; otherwise search all
    const modulesToSearch = candidateModules || Object.keys(amdModules);

    for (const name of modulesToSearch) {
      const mod = amdModules[name];
      if (!mod) continue;

      const candidates = [mod, mod?.default];
      for (const candidate of candidates) {
        if (candidate && typeof candidate === 'function' && candidate.prototype) {
          const proto = candidate.prototype;

          if (componentType === 'WebPart') {
            if (typeof proto.render === 'function') {
              return candidate;
            }
          } else if (componentType === 'Extension') {
            if (typeof proto.onInit === 'function') {
              return candidate;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Get all registered AMD module names
   * Useful for debugging
   * @returns Array of module names
   */
  getModuleNames(): string[] {
    if (typeof window === 'undefined') {
      return [];
    }
    const amdModules = (window as any).__amdModules;
    return amdModules ? Object.keys(amdModules) : [];
  }

  /**
   * Get a module by name
   * @param moduleName - Name of the module
   * @returns Module object or undefined
   */
  getModule(moduleName: string): any {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const amdModules = (window as any).__amdModules;
    return amdModules ? amdModules[moduleName] : undefined;
  }
}

/**
 * Create a ComponentResolver instance
 */
export function createComponentResolver(): ComponentResolver {
  return new ComponentResolver();
}
