# SPFx Local Workbench

A Visual Studio Code extension that brings back the **local workbench** for testing SharePoint Framework (SPFx) web parts and **Application Customizers** without deploying to SharePoint.

> **Background**: Microsoft removed the local workbench in SPFx 1.13+. This extension restores that functionality with a custom-built workbench environment that simulates the SPFx runtime.

## Features

### Web Parts

- **Automatic SPFx Detection**: Automatically detects SPFx projects in your workspace
- **Web Part Discovery**: Parses all web part manifests from your project
- **SPFx Runtime Environment**: Custom-built workbench that simulates the SPFx runtime with AMD module loading
- **Property Pane**: Full property pane support for configuring web parts
- **Live Reload Support**: Works with `heft start` for real-time development
- **Multiple Web Parts**: Add, configure, and test multiple web parts simultaneously on the canvas
- **Theme Support**: Choose from multiple SharePoint theme presets (Team Site, Communication Site, Dark Mode)

### Application Customizers

- **Extension Discovery**: Automatically detects Application Customizer manifests alongside web parts
- **Header & Footer Placeholders**: Simulated `Top` and `Bottom` placeholder zones, just like SharePoint
- **Interactive Add/Remove**: Use the `+` button in the header zone to add extensions from a picker
- **Property Editing**: Click the edit (pencil) icon on a loaded extension to modify its `ClientSideComponentProperties` and re-render
- **PlaceholderProvider Mock**: Full mock of `context.placeholderProvider` including `tryCreateContent()` and `changedEvent`

### Storybook Integration (Beta)

- **Auto-Generated Stories**: Automatically generates Storybook stories from your SPFx component manifests
- **Locale Variants**: Creates story variants for each locale defined in your component
- **SPFx Context**: Custom Storybook addon provides full SPFx context and theme switching
- **Visual Testing**: Test components in isolation with different themes and contexts
- **Live Development**: Run Storybook alongside your SPFx project for component development

### API Proxy & Mock System

- **Drop-in HTTP client replacements**: `SPHttpClient`, `HttpClient`, and `AadHttpClient` are replaced with proxy-aware classes — no code changes needed in your web parts
- **Configurable mock rules**: Define URL matching rules with inline or file-based JSON responses
- **Glob pattern matching**: Match URLs with wildcards (e.g., `/_api/web/lists/getbytitle('*')/items`)
- **Client type filtering**: Target rules to specific client types (`spHttp`, `http`, `aadHttp`)
- **Hot reload**: Edit your mock config and rules are reloaded instantly
- **Request logging**: All proxied calls are logged to the "SPFx API Proxy" output channel
- **Fully optional**: Disable the proxy to use real `fetch()` calls with external tools like Dev Proxy

> **[Full proxy documentation →](PROXY.md)** — architecture, setup guide, mock rule reference, and examples.
>
> **[Mock data generation →](MOCK-DATA.md)** — status code stubs, JSON/CSV import, request recording, and more.

## Requirements

- VS Code 1.100.0 or higher
- An SPFx 1.22+ project (Heft-based)
- Node.js and npm/pnpm/yarn

## Getting Started

1. Open your SPFx project in VS Code
2. Start your SPFx development server: Run `heft start` in a terminal
3. Use the Command Palette (`Ctrl+Shift+P`) and search for "SPFx: Open Local Workbench"

## Usage

### Opening the Workbench

There are several ways to open the workbench:

1. **Command Palette**: `Ctrl+Shift+P` → "SPFx: Open Local Workbench"
2. **Status Bar**: Click the "SPFx Workbench" status bar item (shown when an SPFx project is detected)
3. **Quick Command**: Use "SPFx: Start Serve & Open Workbench" to start everything at once

### Starting Development Server

Use the command "SPFx: Start Serve & Open Workbench" to:

1. Start `heft start` in a terminal
2. Open the workbench after a short delay

### How It Works

This extension provides a **custom-built workbench environment** that simulates the SPFx runtime:

1. A TypeScript-based workbench runtime is bundled with the extension
2. When you open the workbench, it loads in a VS Code webview
3. An AMD module loader shim allows SPFx bundles to load and register their modules
4. Mock SharePoint context and APIs are provided to web parts
5. The runtime fetches your web part bundles from `https://localhost:4321`
6. Your web parts render in a simulated SharePoint environment
7. Application Customizers are loaded the same way, with mocked `Top`/`Bottom` placeholder zones rendered above and below the canvas

### Using Storybook for Component Development

The extension includes **Storybook integration** for visual testing and component development:

1. **Generate Stories**: Run "SPFx: Generate Storybook Stories" from the Command Palette
   - Stories are auto-generated from your component manifests
   - Each localized variant gets its own story
   - Stories are created in `src/**/*.stories.ts` next to your components

2. **Open Storybook**: Run "SPFx: Open Storybook" to launch the Storybook dev server
   - Server runs at `http://localhost:6006` by default
   - View opens in a VS Code webview panel
   - Includes toolbar for theme switching and context customization

3. **SPFx Addon**: The custom `@spfx-local-workbench/storybook-addon-spfx` addon provides:
   - Full SPFx context mock (same as workbench)
   - Theme switcher with 10 Microsoft 365 themes
   - Hot reload support during development

4. **Story Structure**: Auto-generated stories follow CSF 3.0 format:

   ```typescript
   import type { Meta, StoryObj } from '@storybook/react';

   import HelloWorldWebPart from './HelloWorldWebPart';

   const meta: Meta<typeof HelloWorldWebPart> = {
     title: 'WebParts/HelloWorld',
     component: HelloWorldWebPart,
     parameters: {
       spfxContext: {
         /* ... */
       },
     },
   };

   export const Default: StoryObj = {};
   ```

## Commands

| Command                              | Description                                 |
| ------------------------------------ | ------------------------------------------- |
| `SPFx: Open Local Workbench`         | Opens the local workbench panel             |
| `SPFx: Start Serve & Open Workbench` | Starts serve and opens workbench            |
| `SPFx: Detect Web Parts`             | Shows detected web parts in the project     |
| `SPFx: Open Storybook`               | Starts Storybook dev server and opens panel |
| `SPFx: Generate Storybook Stories`   | Generates stories from SPFx manifests       |
| `SPFx: Open Developer Tools`         | Opens webview developer tools               |

## Configuration

### General Settings

| Setting                                | Default                  | Description                                                                                      |
| -------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| `spfxLocalWorkbench.serveUrl`          | `https://localhost:4321` | The URL where SPFx serve is running                                                              |
| `spfxLocalWorkbench.autoOpenWorkbench` | `false`                  | Auto-open workbench when starting serve                                                          |
| `spfxLocalWorkbench.statusBarAction`   | `openWorkbench`          | Action when clicking the SPFx status bar item: `openWorkbench`, `startServe`, or `openStorybook` |

### Theme Settings

| Setting                               | Default  | Description                                                                                                                        |
| ------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `spfxLocalWorkbench.theme.current`    | `"Teal"` | Select a Microsoft theme by name (e.g. `"Teal"`, `"Blue"`) or `"Custom"` to use a custom theme                                     |
| `spfxLocalWorkbench.theme.customName` | `""`     | Custom theme name when `theme.current` is set to `"Custom"`. Must match a `name` defined in `theme.custom`                         |
| `spfxLocalWorkbench.theme.custom`     | `[]`     | Custom themes to add alongside the default Microsoft themes. Each theme should have `name`, `isInverted`, and `palette` properties |

> **Note**: The extension includes 10 default Microsoft 365 themes: `Teal`, `Blue`, `Orange`, `Red`, `Purple`, `Green`, `Periwinkle`, `Cobalt`, `Dark Teal`, `Dark Blue`. Themes are identified by their `name` property (case-sensitive). Custom themes defined here also appear in the Storybook theme toolbar under "From your organization".

### Context Settings

Customize the mock SharePoint context:

| Setting                                  | Default   | Description                                                                   |
| ---------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `spfxLocalWorkbench.context.pageContext` | See below | SharePoint page context object (mirrors SPFx `context.pageContext` structure) |

The `pageContext` object includes:

- `site`: Site collection information (absoluteUrl, id)
- `web`: Web information (absoluteUrl, title, description, templateName, id)
- `user`: User information (displayName, email, loginName, isAnonymousGuestUser)
- `cultureInfo`: Culture/locale information (currentCultureName)
- `isNoScriptEnabled`: Whether NoScript is enabled
- `isSPO`: Whether this is SharePoint Online

You can add additional properties as needed to match your SPFx solution requirements.

### Storybook Settings

| Setting                                              | Default               | Description                                                    |
| ---------------------------------------------------- | --------------------- | -------------------------------------------------------------- |
| `spfxLocalWorkbench.storybook.port`                  | `6006`                | Port for the Storybook dev server                              |
| `spfxLocalWorkbench.storybook.autoGenerate`          | `true`                | Automatically generate stories from SPFx manifests             |
| `spfxLocalWorkbench.storybook.generateLocaleStories` | `true`                | Generate story variants for each locale                        |
| `spfxLocalWorkbench.storybook.storiesPattern`        | `src/**/*.stories.ts` | Glob pattern for custom story files                            |
| `spfxLocalWorkbench.storybook.autoDocs`              | `false`               | Enable auto-generated documentation pages for stories          |
| `spfxLocalWorkbench.storybook.skipInstallPrompt`     | `false`               | Automatically install Storybook dependencies without prompting |

### Proxy Settings

| Setting                                   | Default                          | Description                                                                                                                                                                                                                                                     |
| ----------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spfxLocalWorkbench.proxy.enabled`        | `true`                           | Enable the API proxy. When `false`, HTTP clients make real `fetch()` calls so you can use external tools like [Dev Proxy](https://learn.microsoft.com/microsoft-cloud/dev/dev-proxy/overview). **Requires closing and reopening the workbench to take effect.** |
| `spfxLocalWorkbench.proxy.mockFile`       | `.spfx-workbench/api-mocks.json` | Path to the mock rules configuration file (relative to workspace root)                                                                                                                                                                                          |
| `spfxLocalWorkbench.proxy.defaultDelay`   | `0`                              | Default simulated latency (ms) for mock responses                                                                                                                                                                                                               |
| `spfxLocalWorkbench.proxy.fallbackStatus` | `404`                            | HTTP status returned when no mock rule matches                                                                                                                                                                                                                  |
| `spfxLocalWorkbench.proxy.logRequests`    | `true`                           | Log proxied requests to the "SPFx API Proxy" output channel                                                                                                                                                                                                     |

> See [PROXY.md](PROXY.md) for the full mock rule reference, architecture details, and examples.

## Troubleshooting

Having issues? See the [Troubleshooting Guide](TROUBLESHOOTING.md).

## Contributing

Contributions are welcome! See the [Contributing Guide](CONTRIBUTING.md) for development setup, project structure, and more.

## Development

### Building the Extension

```bash
npm install
npm run compile
```

### Sample SPFx Projects

If you keep test SPFx projects under `samples/`, they are excluded from VSIX packaging and VS Code search to keep the extension lean. The folder is still visible in the explorer. For the most reliable detection and debugging, open a sample project folder directly in its own VS Code window (or Extension Host) when testing.

### Project Structure

```text
src/
  extension.ts              # Main extension entry point
  workbench/
    WorkbenchPanel.ts       # Webview panel that hosts the workbench
    SpfxProjectDetector.ts  # SPFx project detection and manifest parsing
    html/                   # HTML and CSS generation for webview
    config/                 # Configuration management
    proxy/                  # API proxy service and mock rule engine
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
    proxy/                  # Proxy HTTP client replacements and bridge
    ui/                     # UI utilities (CanvasRenderer)
    types/                  # Webview-specific type definitions
```

## License

MIT License - See LICENSE file for details.
