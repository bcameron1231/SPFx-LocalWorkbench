# Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Building the Extension

```bash
npm install
npm run compile
```

## Publishing NPM Packages

The extension version in the root `package.json` is the source of truth for the publishable packages in `packages/shared` and `packages/storybook-addon-spfx`.

Use these scripts from the repo root:

```bash
# Bump the root extension version and synchronize both package manifests
npm run version:bump:patch

# Or minor / major
npm run version:bump:minor
npm run version:bump:major

# If you set the root version manually, resync without bumping
npm run version:sync

# Verify the package versions are aligned before publishing
npm run version:check

# Build and publish shared first, then the Storybook addon
npm run packages:publish
```

Notes:

- `packages:publish` publishes `@spfx-local-workbench/shared` before `@spfx-local-workbench/storybook-addon-spfx` so the addon can resolve the newly published shared version.
- The repo root package is marked `private`, and root `npm publish` is explicitly blocked, so an accidental publish from the extension root fails with a clear message instead of publishing the VS Code extension package to npm.
- The Storybook addon dependency on `@spfx-local-workbench/shared` is updated automatically to match the synchronized version while preserving the existing version prefix such as `^`.
- Run `npm login` first for the npm account that owns these packages. If your npm account uses 2FA for publishes, npm will prompt for the one-time code during `npm run packages:publish`.
- `npm version ... --no-git-tag-version` updates the root manifest without creating a commit or git tag; tag and release however you prefer afterward.
- If you want to verify the publish targets without pushing anything, run `node scripts/publish-packages.mjs --dry-run` after a build.

## Publishing The VS Code Extension

The VS Code extension is packaged locally and then uploaded manually to the `m365pnp` publisher in the Marketplace.

From the repo root:

```bash
vsce package
```

Notes:

- `vsce package` uses the root extension manifest and runs the existing `vscode:prepublish` step before generating the `.vsix` file.
- The generated `.vsix` file uses the extension version from the root `package.json`.
- To publish the updated extension to `m365pnp`, go to https://marketplace.visualstudio.com/manage/publishers/m365pnp?noPrompt=true, open the three-dots menu next to the extension, choose `Update`, and upload the generated `.vsix` file.

## Sample SPFx Projects

If you keep test SPFx projects under `samples/`, they are excluded from VSIX packaging and VS Code search to keep the extension lean. The folder is still visible in the explorer. For the most reliable detection and debugging, open a sample project folder directly in its own VS Code window (or Extension Host) when testing.

## Project Structure

```text
src/
  extension.ts              # Main extension entry point
  workbench/
    WorkbenchPanel.ts       # Webview panel that hosts the workbench
    SpfxProjectDetector.ts  # SPFx project detection and manifest parsing
    html/                   # HTML and CSS generation for webview
    config/                 # Configuration management
    types/                  # Type definitions
webview/
  src/
    main.tsx                # React-based webview entry point
    main.ts                 # Alternative non-React entry point
    WorkbenchRuntime.ts     # Main workbench orchestrator
    WebPartManager.ts       # Web part loading and lifecycle
    ExtensionManager.ts     # Application Customizer loading and lifecycle
    amd/                    # AMD module loader for SPFx bundles
    components/             # React components (App, Canvas, PropertyPane, ExtensionPicker, etc.)
    mocks/                  # SharePoint API mocks (Context, Theme, sp-application-base)
    ui/                     # UI utilities
    types/                  # Webview-specific type definitions
packages/
  shared/                   # Shared code between extension and Storybook addon
    src/
      mocks/                # SPFx mocks (MockGuid, contextBuilder, PropertyPaneMocks)
      components/           # Shared React components (ThemePreview)
      utilities/            # Shared type definitions (themeTypes)
  storybook-addon-spfx/     # Standalone Storybook addon for SPFx components
```

## Shared Package

The `@spfx-local-workbench/shared` package contains code shared between the VS Code extension and the Storybook addon.

### Constants

**Application constants** (timing values, port numbers, etc.) are defined in `packages/shared/src/constants/`:

- `timing.ts` - Delays, timeouts, and debounce intervals
- `ports.ts` - Default port numbers for development servers
- `DEFAULT_PAGE_CONTEXT.ts` - Default SPFx page context values
- `MICROSOFT_THEMES.ts` - Built-in SharePoint themes

When adding magic numbers or hardcoded values:

1. Extract to an appropriately named constant in the relevant file
2. Add JSDoc comments explaining the constant's purpose
3. Export from `constants/index.ts`
4. Rebuild packages: `npm run packages:build`

### Important: Default Value Synchronization

**Default pageContext values** are defined in `packages/shared/src/constants/DEFAULT_PAGE_CONTEXT.ts` (`DEFAULT_PAGE_CONTEXT`).

⚠️ **These values MUST be manually kept in sync with `package.json`** (`spfxLocalWorkbench.context.pageContext` default values) due to JSON schema limitations for VS Code settings.

When updating default context values:

1. Update `packages/shared/src/constants/DEFAULT_PAGE_CONTEXT.ts` (source of truth)
2. Update `package.json` configuration schema defaults to match
3. Rebuild packages: `npm run packages:build`

## TypeScript Configuration

The project uses specific TypeScript compiler options in `tsconfig.json` that differ from defaults:

### `skipLibCheck: true`

**Why:** Storybook v8 type definitions use ESM modules internally, which conflicts with the extension's Node16/CommonJS module resolution. This setting allows TypeScript to skip type checking of `node_modules` declarations while still providing IntelliSense and autocomplete for our template files (`src/workbench/storybook/templates/`).

**Trade-off:** We lose type checking of third-party library definitions, but gain the ability to use Storybook types for editor support without compilation errors.

### `module: "Node16"`

**Why:** Ensures proper Node.js module resolution for VS Code extensions, which run in a Node.js environment. This supports both CommonJS and ESM imports as used by Node.js 16+.

### `jsx: "react"`

**Why:** The extension includes React components in the webview UI. This setting enables JSX syntax transformation for `.tsx` files.

### Path Aliases

The `paths` configuration maps `@spfx-local-workbench/shared` to `./packages/shared/src` for importing shared code between the extension and Storybook addon without relative paths.
