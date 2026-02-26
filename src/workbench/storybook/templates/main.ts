import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    // Auto-generated stories from SPFx manifests
    '../generated/**/*.stories.@(ts|tsx)',
    // User-created stories in src directory
    '../../src/**/*.stories.@(ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@spfx-local-workbench/storybook-addon-spfx'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true
  },
  async viteFinal(config) {
    // Forces Vite to pre-bundle the shared packages via esbuild (CJS → ESM).
    //
    // @spfx-local-workbench/shared is a CJS package. When installed via a file:
    // reference (development), npm symlinks it instead of copying it. Vite detects
    // symlinks and bypasses its pre-bundler, serving raw CJS via /@fs/ URLs that
    // ESM imports cannot consume — named exports are missing. Listing them in
    // optimizeDeps.include forces pre-bundling regardless of install method.
    //
    // /fluent is a sub-path export that isolates @fluentui/react-dependent code so
    // the Storybook manager bundle never loads it at init time.
    //
    // In production (installed from npm) this is a no-op — safe to keep permanently.
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = config.optimizeDeps.include || [];
    const toInclude = [
      '@spfx-local-workbench/shared',
      '@spfx-local-workbench/shared/fluent',
    ];
    for (const dep of toInclude) {
      if (!config.optimizeDeps.include.includes(dep)) {
        config.optimizeDeps.include.push(dep);
      }
    }

    return config;
  }
};

export default config;
