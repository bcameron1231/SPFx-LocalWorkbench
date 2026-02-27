/**
 * Storybook preset for SPFx addon
 * This file tells Storybook how to load the addon
 */
import path from 'path';

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, '@spfx-local-workbench/storybook-addon-spfx/manager'];
}

export function previewAnnotations(entry: string[] = []): string[] {
  return [...entry, '@spfx-local-workbench/storybook-addon-spfx/preview'];
}

/**
 * Forces Vite to pre-bundle the shared packages via esbuild.
 *
 * @spfx-local-workbench/shared is an ESM package installed via a `file:`
 * reference during development (npm symlinks it instead of copying it).
 * Vite detects symlinks and may bypass its pre-bundler, serving the file
 * directly via a `/@fs/` URL. Because the package is now ESM this is safe
 * for named exports, but listing it in `optimizeDeps.include` still forces
 * a single pre-bundled copy, which avoids module-identity split issues when
 * the same package is reachable from multiple node_modules paths.
 *
 * The `/fluent` sub-path export is listed separately because it is a distinct
 * Vite entry point that exposes @fluentui/react-dependent utilities in
 * isolation so the Storybook manager bundle never pulls in @fluentui/react
 * at init time.
 *
 * server.fs.allow:
 * The addon (and shared) resolve outside the Storybook project root via
 * symlink. Vite's default server.fs.strict would block `/@fs/` requests
 * with 403. Adding the addon directory and its parent (packages/) to
 * server.fs.allow fixes this without widening security beyond what is needed.
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

  // __dirname here is the dist/storybook-addon-spfx/src/ directory of the addon.
  // Navigate up 3 levels to reach the addon package root, then one more to the
  // packages/ directory (which also contains the sibling shared package).
  const addonRoot = path.resolve(__dirname, '../../..');
  const packagesDir = path.resolve(addonRoot, '..');
  config.server ??= {};
  config.server.fs ??= {};
  config.server.fs.allow ??= [];
  for (const dir of [addonRoot, packagesDir]) {
    if (!config.server.fs.allow.includes(dir)) {
      config.server.fs.allow.push(dir);
    }
  }

  return config;
}
