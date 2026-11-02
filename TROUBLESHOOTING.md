# Troubleshooting

## "Could not load manifests from serve URL"

- Make sure `heft start` (or `gulp serve` in a gulp project) is running
- Check that the serve URL matches your SPFx project's port (default: 4321)
- Ensure you have trusted the dev certificate by running `heft trust-dev-cert` (see [Certificate errors](#certificate-errors))
- SPFx 1.22+ projects use Heft; older projects that use gulp are supported too (see [docs/gulp-projects.md](docs/gulp-projects.md))

## Web parts not rendering

- Open DevTools in the workbench (click "DevTools" button) to see console errors
- Verify your SPFx project builds successfully
- Check that your web part bundle is being served correctly

## Application Customizer not rendering

- Open DevTools and check for errors loading the extension bundle
- Ensure your extension's `componentType` is set to `"Extension"` in the manifest
- Verify the extension bundle is being served (check `internalModuleBaseUrls` in the manifest)
- If the extension uses localized strings, a proxy mock is provided automatically

## Certificate errors

The SharePoint Framework's local web server uses HTTPS by default via a development self-signed SSL certificate. Self-signed SSL certificates are not trusted by your developer environment, so you must first configure your development environment to trust the certificate.

Run the following command to trust the dev certificate:

```bash
heft trust-dev-cert
# gulp projects (SPFx 1.21 and older)
gulp trust-dev-cert
```

For more details, see the [official documentation](https://learn.microsoft.com/sharepoint/dev/spfx/set-up-your-development-environment#trusting-the-self-signed-developer-certificate).

## YouTube (and other video embeds) show Error 153 / "Video player configuration error"

This is a known limitation of the local workbench.

**Root cause**: YouTube requires a valid HTTPS `Referer` header for all embedded player requests (YouTube policy change, mid-2025). The VS Code webview runs at the `vscode-webview://` scheme rather than an HTTPS origin. Because browsers do not send a `Referer` header when navigating from a non-HTTPS page to an HTTPS URL (per the `strict-origin-when-cross-origin` default policy), the YouTube player never receives an identity it can verify, and returns Error 153 (`embedder.identity.missing.referrer`).

**Why it works in the online SharePoint workbench**: SharePoint pages are served over HTTPS, so the browser automatically sends `https://tenant.sharepoint.com/…` as the Referer when the web part creates a YouTube iframe.

**Workaround**: Test YouTube (and other video embeds that perform origin checking) in Storybook. Video embed playback that depends on a verified HTTPS embedding origin is not fixable at the workbench level without a significant architectural change (serving the workbench itself from an HTTPS origin).


## Other issues

| Symptom | Cause | Fix |
|---|---|---|
| Workbench still shows old behaviour after installing a new `.vsix` | VS Code caches the webview code | Close every VS Code window and reopen it; a window reload is not enough |
| gulp project: strings or bundles not found | `serveUrl` wrong, or serve not running | See [docs/gulp-projects.md](docs/gulp-projects.md) |
| `403` / sign-in errors for tenant requests | Tenant settings, scopes or consent | See the troubleshooting table in [TENANT.md](TENANT.md) and **View > Output > SPFx API Proxy** |
| `NotifyScriptLoadedAndExecuteWaitingJobs is not defined` from `SP.*.js` | The web part loaded a JSOM script without `/_layouts/15/init.js` first (on SharePoint pages init.js is usually already there) | Load `init.js` before the other JSOM scripts in your web part |
| Tenant images or profile photos do not show (avatars show initials) | SharePoint refuses the sign-in token on that address | Check **SPFx API Proxy** for the `retrying through ...` lines of the [authentication patches](TENANT.md#authentication-patches) |
| Web part layout does not adapt when columns change | It sizes itself only on load | Handle `onAfterResize`; the SharePoint layout calls it when the width changes |
