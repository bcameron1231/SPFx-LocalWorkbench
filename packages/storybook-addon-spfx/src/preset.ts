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
 * Webpack configuration for CSS modules
 * This ensures readable class names in development mode
 */
export async function webpackFinal(config: any) {
  // Find the css-loader rule and customize CSS modules naming
  const rules = config.module?.rules || [];

  for (const rule of rules) {
    if (!rule || typeof rule === 'string') continue;

    const ruleUse = Array.isArray(rule.use) ? rule.use : [rule.use];

    for (const use of ruleUse) {
      if (!use || typeof use === 'string') continue;

      if (use.loader && use.loader.includes('css-loader')) {
        // Configure CSS modules with readable class names
        if (use.options && use.options.modules) {
          use.options.modules.localIdentName = '[name]__[local]__[hash:base64:5]';
        }
      }
    }
  }

  return config;
}
