const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Plugin to copy template files
 */
const copyTemplatesPlugin = {
  name: 'copy-templates',
  setup(build) {
    build.onEnd(() => {
      // Copy template files to dist
      const templatesDir = path.join(__dirname, 'src/workbench/storybook/templates');
      const distTemplatesDir = path.join(__dirname, 'dist/templates');

      // Create dist/templates directory if it doesn't exist
      if (!fs.existsSync(distTemplatesDir)) {
        fs.mkdirSync(distTemplatesDir, { recursive: true });
      }

      // Copy each template file
      const templates = ['main.ts', 'preview.ts', 'manager.ts', 'theme.json', 'package.json'];
      templates.forEach((template) => {
        const src = path.join(templatesDir, template);
        const dest = path.join(distTemplatesDir, template);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      });
    });
  },
};

/**
 * Plugin to copy localization files
 */
const copyLocalizationPlugin = {
  name: 'copy-localization',
  setup(build) {
    build.onEnd(() => {
      const distDir = path.join(__dirname, 'dist');

      // Ensure dist directory exists
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      // Copy extension.nls.json and extension.nls.*.json files
      // These must match the bundle output filename (extension.js -> extension.nls.json)
      const nlsDir = path.join(__dirname, 'src', 'loc');
      const nlsFiles = fs.existsSync(nlsDir)
        ? fs
            .readdirSync(nlsDir)
            .filter((file) => file.startsWith('extension.nls') && file.endsWith('.json'))
        : [];

      nlsFiles.forEach((file) => {
        const src = path.join(nlsDir, file);
        const dest = path.join(distDir, file);
        fs.copyFileSync(src, dest);
      });

      if (nlsFiles.length > 0) {
        console.log(`[nls] Copied ${nlsFiles.length} localization file(s)`);
      }
    });
  },
};

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [
      copyTemplatesPlugin,
      copyLocalizationPlugin,
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
