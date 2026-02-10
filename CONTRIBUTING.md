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
    mocks/                  # SharePoint API mocks (Context, Theme, PropertyPane, sp-application-base)
    ui/                     # UI utilities (CanvasRenderer)
    types/                  # Webview-specific type definitions
```
