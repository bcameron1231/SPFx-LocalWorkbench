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

## Commands

| Command | Description |
|---------|-------------|
| `SPFx: Open Local Workbench` | Opens the local workbench panel |
| `SPFx: Start Serve & Open Workbench` | Starts serve and opens workbench |
| `SPFx: Detect Web Parts` | Shows detected web parts in the project |

## Configuration

### Basic Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `spfxLocalWorkbench.serveUrl` | `https://localhost:4321` | The URL where SPFx serve is running |
| `spfxLocalWorkbench.autoOpenWorkbench` | `false` | Auto-open workbench when starting serve |

### Context Settings

Customize the mock SharePoint context:

| Setting | Default | Description |
|---------|---------|-------------|
| `spfxLocalWorkbench.context.siteUrl` | `https://contoso.sharepoint.com/sites/devsite` | SharePoint site URL |
| `spfxLocalWorkbench.context.webUrl` | `https://contoso.sharepoint.com/sites/devsite` | SharePoint web URL |
| `spfxLocalWorkbench.context.userDisplayName` | `Local Workbench User` | Display name of the current user |
| `spfxLocalWorkbench.context.userEmail` | `user@contoso.onmicrosoft.com` | Email address of the current user |
| `spfxLocalWorkbench.context.culture` | `en-US` | Culture/locale (e.g., en-US, de-DE, fr-FR) |
| `spfxLocalWorkbench.context.customContext` | `{}` | Additional custom context properties (JSON object) |

### Theme Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `spfxLocalWorkbench.theme.preset` | `teamSite` | Theme preset: `teamSite`, `communicationSite`, `dark`, `highContrast`, or `custom` |
| `spfxLocalWorkbench.theme.customColors` | `{}` | Custom theme colors when using `custom` preset |

### Page Context Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `spfxLocalWorkbench.pageContext.webTitle` | `Local Workbench` | Title of the web |
| `spfxLocalWorkbench.pageContext.webTemplate` | `STS#3` | Web template ID |
| `spfxLocalWorkbench.pageContext.isSPO` | `true` | Whether this is SharePoint Online |

## Troubleshooting

Having issues? See the [Troubleshooting Guide](TROUBLESHOOTING.md).

## Contributing

Contributions are welcome! See the [Contributing Guide](CONTRIBUTING.md) for development setup, project structure, and more.

## License

MIT License - See LICENSE file for details.
