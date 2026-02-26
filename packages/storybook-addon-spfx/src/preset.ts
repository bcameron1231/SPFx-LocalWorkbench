/**
 * Storybook preset for SPFx addon
 * This file tells Storybook how to load the addon
 */

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, '@spfx-local-workbench/storybook-addon-spfx/manager'];
}

export function previewAnnotations(entry: string[] = []): string[] {
  return [...entry, '@spfx-local-workbench/storybook-addon-spfx/preview'];
}

/**
 * Forces Vite to pre-bundle the shared packages via esbuild (CJS → ESM conversion).
 *
 * Why this is needed:
 * - `@spfx-local-workbench/shared` is a CJS package ("module": "commonjs").
 * - During development it is installed via a `file:` reference, which npm symlinks
 *   rather than copying. Vite detects symlinks and bypasses its pre-bundler, serving
 *   the raw CJS directly via a `/@fs/` URL. ESM `import` statements cannot consume
 *   raw CJS — named exports are missing and the module fails to load.
 * - Adding the packages to `optimizeDeps.include` forces Vite to always run them
 *   through esbuild pre-bundling regardless of how they were installed, converting
 *   CJS to a proper ESM wrapper.
 *
 * In production (installed from npm), pre-bundling an already-correct package is
 * a no-op, so this hook is safe to keep permanently.
 *
 * The `/fluent` sub-path export is listed separately because it is a distinct Vite
 * entry point. It exposes @fluentui/react-dependent utilities in isolation so that
 * the Storybook manager bundle never pulls in @fluentui/react at init time (it is
 * unavailable in that context and would cause the entire utilities barrel to fail).
 */
export async function viteFinal(config: any) {
  config.optimizeDeps ??= {};
  config.optimizeDeps.include ??= [];
  const toInclude = ['@spfx-local-workbench/shared', '@spfx-local-workbench/shared/fluent'];
  for (const dep of toInclude) {
    if (!config.optimizeDeps.include.includes(dep)) {
      config.optimizeDeps.include.push(dep);
    }
  }
  return config;
}
