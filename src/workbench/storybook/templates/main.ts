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
    // Ensure shared package is optimized for ESM in Vite
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = config.optimizeDeps.include || [];
    config.optimizeDeps.include.push('@spfx-local-workbench/shared');
    
    return config;
  }
};

export default config;
