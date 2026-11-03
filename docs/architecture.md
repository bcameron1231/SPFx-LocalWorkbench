# Architecture

How the extension is put together, for anyone changing it. User-facing behaviour is in [README.md](../README.md);
the API proxy is described in depth in [PROXY.md](../PROXY.md).

## The three runtimes

```
┌──────────────────────── VS Code extension host (Node) ───────────────────────┐
│ src/extension.ts            commands, status bar, activation                │
│ src/workbench/WorkbenchPanel.ts   creates the webview, relays messages       │
│ src/workbench/config/       VS Code settings + personal settings file        │
│ src/workbench/proxy/        ApiProxyService, mock rules, TenantForwarder     │
│ src/workbench/storybook/    Storybook server and story generation           │
└───────────────▲──────────────────────────────────────────────┬───────────────┘
                │ postMessage (proxy requests, settings, state)  │ HTML + config
┌───────────────┴──────────────────────────────────────────────▼───────────────┐
│ Webview (browser) – webview/src                                              │
│ main.tsx            boot, message handling, persistence                      │
│ WorkbenchRuntime.ts AMD loader shim, loads bundles from serveUrl, lifecycle  │
│ WebPartManager.ts   creates web part instances with a mock SPFx context      │
│ mocks/              SpfxContext, ThemeProvider, SpfxThemeService             │
│ proxy/              VsCodeProxyTransport, tenantUrls/Images/Jsom             │
│ canvas/             page layout model + section themes (pure, unit-tested)   │
│ components/         App, WorkbenchCanvas, SharePointCanvas, toolbars, panes  │
└──────────────────────────────▲───────────────────────────────────────────────┘
                               │ imports
┌──────────────────────────────┴───────────────────────────────────────────────┐
│ packages/shared – used by the webview AND the Storybook addon               │
│ mocks/ (page context, platform modules), proxy/ (http clients, interceptors),│
│ loaders/ (StringsLoader), components/ (PropertyPanePanel, theme picker)      │
└──────────────────────────────────────────────────────────────────────────────┘
packages/storybook-addon-spfx – Storybook addon, must stay usable without VS Code
```

Your SPFx project's dev server (`heft start` or `gulp serve`) runs separately and serves the bundles the webview loads from
`spfxLocalWorkbench.serveUrl` (default `https://localhost:4321`).

## Request flow

1. A web part calls `spHttpClient`, `httpClient`, `aadHttpClient`, `msGraphClientFactory` or `fetch`.
2. The proxy clients in `packages/shared/src/proxy` (and the fetch interceptor) serialize the request and send it
   to the extension host through `VsCodeProxyTransport`.
3. `ApiProxyService` matches it against the mock rules (`.spfx-workbench/api-mocks.json`). A match returns the mock.
4. Without a match: in `mock` mode the fallback status; in passthrough modes a real request. For the configured
   tenant, `TenantForwarder` adds a token from `vscode.authentication` and enforces the read-only guard
   ([TENANT.md](../TENANT.md)), and applies the
   [authentication patches](../TENANT.md#authentication-patches) for addresses where SharePoint refuses tokens
   (direct file links, `userphoto.aspx`, static `_layouts` files).
5. The response (binary bodies base64-encoded) goes back to the webview.

The token never reaches the webview. Web parts get a placeholder from `aadTokenProviderFactory`.

## Canvas modes

`spfxLocalWorkbench.canvas.layout` picks the canvas:

- `free` – a single column (`components/WorkbenchCanvas`), the default.
- `sharepoint` – `components/SharePointCanvas`: sections with columns, widths and edit chrome measured on a real
  SharePoint page ([sharepoint-canvas-measurements.md](sharepoint-canvas-measurements.md)).

Key decisions:

- **The layout model is pure.** `canvas/pageLayout.ts` returns new layouts and never mutates; it holds web part
  instance IDs, not elements. It has unit tests (`pageLayout.test.ts`).
- **Web part DOM is kept outside React.** `canvas/webPartHosts.ts` gives each web part one element for its lifetime;
  `WebPartZone.tsx` adopts it into whichever slot the web part sits in. Without this, moving a section or changing
  its columns would make React drop the rendered web part.
- **Section themes use Fluent's ThemeGenerator.** `canvas/sectionTheme.ts` builds a palette from the section's
  colour pair; `SpfxThemeService` hands each web part instance its own `ThemeProvider` view, so web parts that
  consume `ThemeProvider.serviceKey` get the section variant, as in SharePoint.
- **Resize is measured, not observed.** `ResizeObserver` doesn't fire while a webview is hidden, so
  `WorkbenchRuntime` re-measures web part widths after layout changes and window resizes and calls
  `onAfterResize` when a width changed.
- **State persists** through `vscode.setState` (web parts, properties, layout), restored on reload.

## Settings sources

1. VS Code settings set explicitly win (the `tenant.*` settings are machine-scoped: user settings only).
2. Then the personal settings file `~/.spfx-local-workbench/settings.json` (`PersonalSettings.ts`), for values that
   are per developer and must never be committed: tenant, site, app ID, `allowWrites`.
3. Then the defaults in `package.json`.

## Builds and outputs

| Command | Output |
|---|---|
| `npm run compile` | packages, type-check, lint, CSS module types, `dist/extension.js`, `dist/webview/` |
| `npm run watch` | the same, incrementally (used by F5) |
| `npm test` | Vitest unit tests (`*.test.ts` next to the code) |
| `npx vsce package` | a `.vsix` (runs `vscode:prepublish` → production build) |

## Where to start for common changes

| Change | Start in |
|---|---|
| A missing SPFx context API | `packages/shared/src/mocks/`, then `webview/src/mocks/SpfxContext.ts` |
| Page sections, columns, widths | `webview/src/canvas/pageLayout.ts`, `components/SharePointCanvas/` |
| Section colours/backgrounds | `webview/src/canvas/sectionTheme.ts`, `SectionDesignPane.tsx` |
| Tenant sign-in, scopes, read-only guard, authentication patches | `src/workbench/proxy/TenantForwarder.ts` |
| JSOM, SharePoint-hosted images | `webview/src/proxy/tenantJsom.ts`, `tenantImages.ts`, `tenantUrls.ts` |
| A request handled wrongly | `packages/shared/src/proxy/`, then `src/workbench/proxy/` |
| A new setting | `package.json` + `package.nls.json` (and `package.nls.fr.json`), `src/workbench/config/WorkbenchConfig.ts`, `WorkbenchPanel.ts` (send to webview), `webview/src/types` |
| Web part loading, strings | `webview/src/WorkbenchRuntime.ts`, `packages/shared/src/loaders/` |
