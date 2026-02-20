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
      const templates = ['main.ts', 'preview.ts', 'manager.ts'];
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
