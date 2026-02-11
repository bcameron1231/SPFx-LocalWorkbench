# Troubleshooting

## "Could not load manifests from serve URL"

- Make sure `heft start` is running
- Check that the serve URL matches your SPFx project's port (default: 4321)
- Ensure you have trusted the dev certificate by running `heft trust-dev-cert` (see [Certificate errors](#certificate-errors))
- This extension only supports SPFx 1.22+ (Heft-based projects)

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
```

For more details, see the [official documentation](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-development-environment#trusting-the-self-signed-developer-certificate).
