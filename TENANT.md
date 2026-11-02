# Real tenant data in the local workbench

The workbench can send a web part's SharePoint and Microsoft Graph requests to **your own Microsoft 365
tenant**, signed in with your account. Mock rules still win: a request that matches a rule in
`.spfx-workbench/api-mocks.json` gets the mock, everything else for your tenant gets real data.

- **SharePoint data** (lists, search, site info) works with VS Code's built-in Microsoft sign-in. You need
  [your personal settings](#1-personal-settings), nothing else.
- **Microsoft Graph data** (Outlook calendars, Microsoft 365 groups, Entra ID users) also needs
  [an Entra ID app](#2-entra-id-app-for-microsoft-graph). Without it, Graph sources are denied with a clear
  message, and SharePoint data keeps working.

## How it works

- Requests to the SharePoint host of your site and to `https://graph.microsoft.com` are sent **by the
  extension**, not by the web part's page, with a token from VS Code's Microsoft sign-in
  ([`vscode.authentication`](https://code.visualstudio.com/api/references/vscode-api#authentication)).
- **The token never reaches the web part.** Web parts get a placeholder from `aadTokenProviderFactory`. The
  extension drops the request's own `Authorization`/`Cookie` headers and adds the real token.
- **Read-only by default.** `GET` requests, SharePoint POSTs that only read (`contextinfo`, search `postquery`,
  `RenderListDataAsStream`, `RenderListFilterData`, `GetItems`) and batches made only of reads are sent. Anything
  else gets a `403` from the workbench unless you set `allowWrites`.
- **JSOM works.** `SPComponentLoader.loadScript('/_layouts/15/SP.js')` and the other JSOM scripts are fetched from
  your tenant (anonymously: SharePoint rejects tokens on static `_layouts` files), the page gets
  `_spPageContextInfo`, and JSOM's `XMLHttpRequest` calls go through the proxy. `ProcessQuery` requests count as
  reads unless they call a write method (`Update`, `Add*`, `Delete*`, `Recycle`, `SetFieldValue`, ...) on a server
  object; filling client-side objects such as a `KeywordQuery` is a read.
- **SharePoint images load.** `<img>` (`src`/`srcset`) and inline `background-image` that point at your site are
  loaded through the proxy and replaced with a local `blob:` URL. Some image links need an
  [authentication patch](#authentication-patches) to load.
- If a sign-in fails, the extension remembers it and stops asking. Requests for that resource get a `403`
  explaining why, and a notification links to this guide. Change your settings or reload the window to try again.

## Authentication patches

A web part's requests reach your tenant unchanged, as they would from a SharePoint page. The difference is how
they're signed in: a SharePoint page sends your browser's sign-in **cookie**, while the workbench can only send an
**access token** (a VS Code extension can't hold a SharePoint browser session, and SharePoint's endpoint that turns
a token into a cookie only accepts Microsoft's own apps). SharePoint accepts tokens on its APIs but not on every
address, so the workbench patches the cases below. Each patch only runs when the original request fails, and logs
a line in the **SPFx API Proxy** output channel.

| Request | What SharePoint does with a token | Patch | Where |
|---|---|---|---|
| Static `_layouts` files (`/_layouts/15/SP.js`, CSS, images, fonts) | `401` | Sent without a token (they are public) | `TenantForwarder.tryForward` |
| Direct file links (`/sites/x/Media/photo.png`, what list image columns hold) | `401` | Retried once through the same site's `/_layouts/15/download.aspx?SourceUrl=...`, which returns the same file | `TenantForwarder.toDownloadUrl` |
| Profile photos (`/_layouts/15/userphoto.aspx?size=M&username=...`) | `401` some of the time | Retried once through Microsoft Graph, `/v1.0/users/{user}/photos/{size}/$value` (`S` 48, `M` 96, `L` 240 pixels). Needs Graph sign-in (`clientId`, `User.ReadBasic.All`); without it the photo stays missing | `TenantForwarder.toGraphPhotoUrl` |
| Any tenant `<img>` | Its first load, made by the webview itself, always fails (no sign-in) | The page doesn't see that failure (`error` event stopped), so components such as avatars don't switch to their fallback before the signed-in copy arrives. If the signed-in load fails too, the image gets a `data:,` source that fails for real and the fallback runs | `webview/src/proxy/tenantImages.ts` |

Add a patch only for a case like these: the original request is correct and works on a SharePoint page, and only
its sign-in fails here. Document it in this table.

## 1. Personal settings

Your tenant, site and app ID are personal: they live in **`~/.spfx-local-workbench/settings.json`**
(on Windows `%USERPROFILE%\.spfx-local-workbench\settings.json`), outside every repository and workspace.
Run **SPFx Local Workbench: Open Personal Settings** to create it from a template.

```json
{
  "tenantId": "contoso.onmicrosoft.com",
  "siteUrl": "https://contoso.sharepoint.com/sites/dev",
  "clientId": "",
  "allowWrites": false,
  "graphTokenHosts": []
}
```

| Key | Required | What it does |
|---|---|---|
| `tenantId` | yes | Tenant to sign in to: its ID or domain. Setting it turns tenant mode on and sets the proxy mode to `mock-passthrough`. |
| `siteUrl` | yes | Site the workbench page context points at. Requests to its host are sent to your tenant. |
| `clientId` | for Graph | Application (client) ID of [your Entra ID app](#2-entra-id-app-for-microsoft-graph). Empty: VS Code's own app, SharePoint only. |
| `allowWrites` | no | `true` allows requests that change tenant data. Default `false`. |
| `graphTokenHosts` | no | HTTPS origins of APIs that may receive your Graph token, e.g. a product backend your web part calls with a token from `aadTokenProviderFactory`. Only requests that carry the workbench placeholder token get the real one. List only APIs you trust with your token. |

VS Code settings with the same meaning (`spfxLocalWorkbench.tenant.*`, `spfxLocalWorkbench.proxy.mode`,
`spfxLocalWorkbench.context.pageContext`) win over this file when you set them explicitly. Set
`SPFX_LOCAL_WORKBENCH_SETTINGS` to use another file path.

The `spfxLocalWorkbench.tenant.*` settings are **machine-scoped**: only your user settings count. A workspace or
folder `.vscode/settings.json` cannot set them, so a repository you open can't turn on `allowWrites`, change the
tenant or app, or list a host that receives your token.

Then open the workbench. The first request to your tenant shows VS Code's Microsoft sign-in: pick the account of
**your tenant** (it can differ from the account VS Code is signed in with), and accept the consent.

## 2. Entra ID app (for Microsoft Graph)

**Why:** VS Code signs in with a Microsoft first-party app, which only gets the permissions Microsoft
preauthorized for it. That covers SharePoint (`AllSites.Read`) but not Graph permissions like `Calendars.Read`.
The sign-in then fails with
[AADSTS65002](https://learn.microsoft.com/entra/identity-platform/reference-error-codes#aadsts-error-codes)
(*"must be configured via preauthorization"*). The fix is an app you register.

You need a role that can register apps and grant admin consent (for example Cloud Application Administrator, or
Global Administrator in your own dev tenant).

1. **Register the app**
   ([Register an application](https://learn.microsoft.com/entra/identity-platform/quickstart-register-app)).
   In the [Microsoft Entra admin center](https://entra.microsoft.com): **Entra ID > App registrations > New
   registration**.
   - Name: e.g. `SPFx Local Workbench (dev)`.
   - Supported account types: **Accounts in this organizational directory only** for yourself, or **Accounts in
     any organizational directory** to share one app with a team (see [Sharing one app](#sharing-one-app-with-a-team)).
   - Redirect URI: **Public client/native (mobile & desktop)**, `http://localhost`. Select **Register**.
2. **Copy the Application (client) ID** from the Overview page.
3. **Authentication**: under the **Mobile and desktop applications** platform, add the redirect URIs below, then
   set **Allow public client flows** to **Yes** (under Advanced settings) and **Save**.
   - `https://vscode.dev/redirect`
   - `ms-appx-web://Microsoft.AAD.BrokerPlugin/<client ID>`, which the Windows account picker (WAM) uses
     ([WAM redirect URI](https://learn.microsoft.com/entra/msal/dotnet/acquiring-tokens/desktop-mobile/wam))
4. **API permissions > Add a permission**, all **Delegated**
   ([Graph permissions reference](https://learn.microsoft.com/graph/permissions-reference)):
   - **Microsoft Graph:** `User.Read`, `User.ReadBasic.All`, `Calendars.Read`, `Group.Read.All`, `Sites.Read.All`
   - **SharePoint:** `AllSites.Read`, plus `AllSites.Write` if you set `allowWrites`. With `allowWrites` on, the
     workbench requests `AllSites.Write` instead, so it must be on the app and consented before you sign in.
     You need it for likes, ratings and bookmarks, and for list pickers that list subsites (`_api/web/webs`
     needs "Browse Directories", which `AllSites.Read` doesn't include).
5. **Grant admin consent for <your tenant>**
   ([Grant tenant-wide admin consent](https://learn.microsoft.com/entra/identity/enterprise-apps/grant-admin-consent)).
6. Put the client ID in `clientId` of your personal settings and reload the workbench. You sign in once more,
   now through your app.

Do **not** create a client secret: the workbench is a public client and never needs one.

The permissions requested are configurable (`spfxLocalWorkbench.tenant.graphScopes`,
`spfxLocalWorkbench.tenant.sharePointScopes`). Every scope you request must be on the app and consented.

### Sharing one app with a team

One multi-tenant app avoids each developer registering their own
([Convert to multitenant](https://learn.microsoft.com/entra/identity-platform/howto-convert-app-to-be-multi-tenant)):

- Register it once, with **Accounts in any organizational directory**, in a tenant your organization owns.
- Each developer sets its client ID in `clientId` (or it becomes the extension default).
- Each tenant consents once. An admin of that tenant can use the consent prompt at first sign-in, or open
  `https://login.microsoftonline.com/<tenant>/adminconsent?client_id=<client ID>`.
- Without publisher verification the consent screen shows the app as unverified. Admins can still consent unless
  a tenant policy blocks unverified apps.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `AADSTS65002 ... must be configured via preauthorization` | Graph requested with VS Code's own app | [Register an app](#2-entra-id-app-for-microsoft-graph) and set `clientId` |
| `AADSTS65001` / consent errors | App permissions not consented | Grant admin consent (step 5) |
| `AADSTS50011` / redirect URI mismatch | A redirect URI is missing | Add the URIs from step 3; the error names the one it wanted |
| `AADSTS700016` / `AADSTS90002` | Wrong `clientId` or `tenantId` | Check both in your personal settings |
| SharePoint `403` "Access is denied" on `_api/web/webs` | `AllSites.Read` doesn't include "Browse Directories" (listing subsites); list pickers need it | Add `AllSites.Write` to your app and set `allowWrites` |
| SharePoint `403` "Access is denied" elsewhere | Your account has no access to that list or site | Check permissions in SharePoint |
| `403` "Blocked by the SPFx Local Workbench: writes ... are disabled" | Read-only guard | Expected; set `allowWrites` only if you need writes |
| Requests go to `contoso.sharepoint.com` | No site configured | Set `siteUrl` |
| Images set through CSS classes don't show | Only `<img>` and inline `background-image` are proxied | Known limit |
| Likes, ratings, follows fail with `403` | They are writes | Set `allowWrites`; your app also needs `AllSites.Write` |

Where to look:

- **View > Output > SPFx API Proxy**: every request, whether a mock rule matched, and `Tenant (sharepoint|graph): <status>`.
- **View > Output > Microsoft Authentication**: VS Code's sign-in log, with the scopes requested.
- **SPFx Local Workbench: Open Tenant Setup Guide** opens this page.

## Notes for AI agents

- Never sign in, enter credentials or grant consent for the user. When a sign-in is needed, tell the user what
  VS Code will show and wait.
- Read the two output channels above to diagnose. Outside VS Code they are under the user data folder:
  `logs/<session>/window1/exthost/output_logging_*/*SPFx API Proxy.log` and
  `logs/<session>/window1/exthost/vscode.microsoft-authentication/Microsoft Authentication.log`.
- Do not turn on `allowWrites`, and do not add hosts to `graphTokenHosts`, unless the user asks for it.
- The client ID is a public identifier, not a secret. Never create, store or print client secrets or tokens.
