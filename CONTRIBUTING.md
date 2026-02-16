# Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Building the Extension

```bash
npm install
npm run compile
```

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
1. Update `packages/shared/src/mocks/contextBuilder.ts` (source of truth)
2. Update `package.json` configuration schema defaults to match
3. Rebuild packages: `npm run packages:build`
