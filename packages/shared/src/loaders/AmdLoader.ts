// AMD Module Loader
// 
// This module provides an AMD (Asynchronous Module Definition) loader shim
// that allows SPFx bundles to load and register their modules.

import type { IAmdModules, IAmdPending } from '../types';

// Extend Window interface for AMD globals
// NOTE: These declarations are safe in Node.js - they only extend type definitions
declare global {
  interface Window {
    __amdModules?: IAmdModules;
    __amdPending?: IAmdPending;
    define?: any;
    require?: any;
    requirejs?: any;
    React?: any;
    ReactDOM?: any;
  }
}

export class AmdLoader {
    private amdModules: IAmdModules;
    private amdPending: IAmdPending;
    private initialized: boolean = false;

    constructor() {
        this.amdModules = {};
        this.amdPending = {};
    }

    initialize(): void {
        if (this.initialized) {
            return; // Already initialized
        }

        if (typeof window === 'undefined') {
            throw new Error('AmdLoader requires browser environment');
        }

        // Attach to window
        window.__amdModules = this.amdModules;
        window.__amdPending = this.amdPending;

        // React is required for the workbench UI itself (App, Canvas, Toolbar, etc.).
        // It is also registered as an AMD module so React-based SPFx web parts can
        // resolve require('react') — mirroring how SharePoint provides React as a
        // page-level global. Non-React web parts simply ignore it.
        if (!window.React || !window.ReactDOM) {
            console.error('AmdLoader - React/ReactDOM globals not found. The workbench UI requires React to render.');
            return;
        }

        // Set up AMD define function
        this.setupDefine();

        // Set up AMD require function
        this.setupRequire();

        this.initialized = true;
    }

    private setupDefine(): void {
        const win = window as any;
        win.define = (name: any, deps?: any, factory?: any) => {
            // Handle different call signatures
            if (typeof name !== 'string') {
                factory = deps || name;
                deps = Array.isArray(name) ? name : [];
                name = '_anonymous_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            }
            if (typeof deps === 'function') {
                factory = deps;
                deps = [];
            }

            // Resolve dependencies
            const resolvedDeps = (deps as string[]).map(dep => this.resolveDependency(dep));

            let moduleExports: any;
            if (typeof factory === 'function') {
                const exportsIndex = (deps as string[]).indexOf('exports');
                const moduleIndex = (deps as string[]).indexOf('module');

                try {
                    moduleExports = factory.apply(null, resolvedDeps);
                } catch (e: any) {
                    console.error('AmdLoader - Error executing factory for', name, e);
                }

                if (moduleExports === undefined && exportsIndex >= 0) {
                    moduleExports = resolvedDeps[exportsIndex];
                }
                if (moduleExports === undefined && moduleIndex >= 0) {
                    moduleExports = resolvedDeps[moduleIndex].exports;
                }
            } else {
                moduleExports = factory;
            }

            this.amdModules[name] = moduleExports;

            // Store by short name too
            const shortName = name.split('/').pop();
            if (shortName && shortName !== name) {
                this.amdModules[shortName] = moduleExports;
            }

            // Resolve pending requires
            if (this.amdPending[name]) {
                this.amdPending[name].forEach(cb => cb(moduleExports));
                delete this.amdPending[name];
            }
        };

        (window.define as any).amd = { jQuery: true };
    }

    private setupRequire(): void {
        const win = window as any;
        win.require = (deps: any, callback?: any) => {
            if (typeof deps === 'string') {
                return this.amdModules[deps] || win[deps] || {};
            }

            const resolved = (deps as string[]).map(dep => 
                this.amdModules[dep] || win[dep] || {}
            );
            
            if (callback) {
                callback.apply(null, resolved);
            }
            return resolved[0];
        };

        win.require.config = function() {};
        win.requirejs = win.require;
    }

    private resolveDependency(dep: string): any {
        const win = window as any;
        if (dep === 'exports') return {};
        if (dep === 'require') return win.require;
        if (dep === 'module') return { exports: {} };

        // Try to find the module
        let mod = this.amdModules[dep];
        if (!mod) {
            // Try common variations
            const variations = [
                dep,
                dep.replace(/^@/, '').replace(/\//g, '-'),
                dep.split('/').pop() || dep
            ];
            for (const v of variations) {
                if (this.amdModules[v]) {
                    mod = this.amdModules[v];
                    break;
                }
            }
        }
        if (!mod) mod = win[dep];
        // Handle localized strings modules (e.g. 'HeaderApplicationCustomizerStrings')
        // SPFx generates these as AMD modules; provide a Proxy that returns the key name
        // for any property access so the extension can still render.
        if (!mod && (dep.endsWith('Strings') || dep.includes('Strings/'))) {
            const stringsProxy = new Proxy({} as Record<string, string>, {
                get: (_target, prop) => {
                    if (typeof prop === 'string') {
                        return prop; // Return the key name as the value
                    }
                    return undefined;
                }
            });
            this.amdModules[dep] = stringsProxy;
            mod = stringsProxy;
        }

        if (!mod) {
            console.warn('AmdLoader - Missing dependency:', dep);
            mod = {};
        }
        return mod;
    }

    getModules(): IAmdModules {
        return this.amdModules;
    }
}

/**
 * Singleton instance for shared use across workbench and Storybook
 * Safe to import in Node.js - only accesses window when initialize() is called
 */
let _amdLoaderInstance: AmdLoader | null = null;

export const amdLoader = {
  get instance(): AmdLoader {
    if (!_amdLoaderInstance) {
      _amdLoaderInstance = new AmdLoader();
    }
    return _amdLoaderInstance;
  },
  initialize(): void {
    this.instance.initialize();
  },
  getModules(): IAmdModules {
    return this.instance.getModules();
  }
};
