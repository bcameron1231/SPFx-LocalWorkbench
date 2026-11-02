# Using the workbench with gulp-based SPFx projects (SPFx 1.21 and older)

The workbench is built for SPFx 1.22+ projects that use **Heft**. It only needs what any SPFx dev server produces:
AMD bundles and manifests served over HTTPS. It also handles what projects that still use **gulp** (`gulp serve`)
produce, tested with SPFx 1.21.1.

## Setup

1. Start your project's dev server the way you always do, for example `gulp serve --nobrowser` (or your own npm
   script). Leave it running.
2. In the project's **workspace settings** (`.vscode/settings.json` or a `.code-workspace` file):

   ```json
   {
     "spfxLocalWorkbench.serveUrl": "https://localhost:4321",
     "spfxLocalWorkbench.serveCommand": "gulp serve --nobrowser"
   }
   ```

   `serveCommand` is only used by **Start SPFx Serve and Open Workbench**. If your project starts serve through a
   wrapper script, put that script here, or start serve yourself and use **Open Local Workbench**.
3. Trust the dev certificate once (`gulp trust-dev-cert`), as for the SharePoint hosted workbench.
4. Run **SPFx Local Workbench: Open Local Workbench**.

## What the workbench handles for gulp projects

| Difference from Heft | Handling |
|---|---|
| Localized strings in the compact `localizedPath` form (`{ p: 'AllStrings_', l: { 'en-US': 'en-us' }, s: '.js' }`) | `StringsLoader` resolves both the expanded and the compact form |
| Bundles with several strings modules (own strings plus e.g. `ControlStrings` of `@pnp/spfx-controls-react`) | All of them are loaded and registered |
| Web parts that lazy-load property pane code in `loadPropertyPaneResources()` | The property pane calls the lifecycle hooks in SharePoint's order (`propertyPaneLifecycle.ts`) |
| Web parts that import `@microsoft/sp-loader`, `SPPermission` or `DigestCache` | Mocks for them are registered (`PlatformMocks.ts`) |
| Web parts that call `msGraphClientFactory` | A chainable Graph client that sends its requests through the API proxy (`ProxyGraphClient.ts`), so mock rules can answer them |

## Limits

- Live reload watches `dist/*.js` in the workspace folder. If your build writes bundles elsewhere, refresh the
  workbench by hand after a rebuild.
- Anything your build pipeline does on top of SPFx (custom gulp tasks, license checks, environment switches) is
  your project's business: handle it in the project, not in this extension. Typical approach: a build-time constant
  that is only `true` for local serve builds, so shipped packages never contain the switch.
