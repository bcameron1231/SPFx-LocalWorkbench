/**
 * esbuild configuration for webview bundle
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Copies vendor UMD bundles (React, ReactDOM, Fluent UI) from node_modules
 * into dist/webview/vendor/ so they can be served as local webview assets
 */
function copyVendorFiles() {
    const vendorDir = path.resolve(__dirname, '..', 'dist', 'webview', 'vendor');
    fs.mkdirSync(vendorDir, { recursive: true });

    const suffix = production ? 'production.min' : 'development';
    const vendors = [
        {
            src: path.resolve(__dirname, '..', 'node_modules', 'react', 'umd', `react.${suffix}.js`),
            dest: path.join(vendorDir, 'react.js')
        },
        {
            src: path.resolve(__dirname, '..', 'node_modules', 'react-dom', 'umd', `react-dom.${suffix}.js`),
            dest: path.join(vendorDir, 'react-dom.js')
        },
        {
            src: path.resolve(__dirname, '..', 'node_modules', '@fluentui', 'react', 'dist',
                production ? 'fluentui-react.min.js' : 'fluentui-react.js'),
            dest: path.join(vendorDir, 'fluentui-react.js')
        }
    ];

    for (const { src, dest } of vendors) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${path.basename(src)} -> ${path.relative(process.cwd(), dest)}`);
    }
}

async function build() {
    const ctx = await esbuild.context({
        entryPoints: ['webview/src/main.tsx'],
        bundle: true,
        outfile: 'dist/webview/webview.js',
        loader: { 
            '.tsx': 'tsx', 
            '.ts': 'ts',
            '.css': 'css',
        },
        plugins: [
            {
                name: 'css-modules-convention',
                setup(build) {
                    // Treat *.module.css as CSS modules (locally scoped)
                    build.onResolve({ filter: /\.module\.css$/ }, args => ({
                        path: path.resolve(args.resolveDir, args.path),
                        namespace: 'css-module',
                    }));
                    build.onLoad({ filter: /.*/, namespace: 'css-module' }, args => ({
                        contents: `@import ${JSON.stringify(args.path)};`,
                        loader: 'local-css',
                        resolveDir: path.dirname(args.path),
                    }));
                },
            },
        ],
        format: 'iife',
        target: 'es2020',
        platform: 'browser',
        sourcemap: !production,
        minify: production,
        treeShaking: true,
        external: [],
        alias: {
            'react': './webview/react-shim.js',
            'react-dom': './webview/react-dom-shim.js',
            '@fluentui/react': './webview/fluent-shim.js'
        },
        define: {
            'process.env.NODE_ENV': production ? '"production"' : '"development"'
        },
        logLevel: 'info'
    });

    // Copy vendor UMD files (React, ReactDOM, Fluent UI) to dist
    copyVendorFiles();

    if (watch) {
        await ctx.watch();
        console.log('Watching webview files for changes...');
    } else {
        await ctx.rebuild();
        await ctx.dispose();
        console.log('Webview build complete');
    }
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
