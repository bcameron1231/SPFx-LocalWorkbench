# Troubleshooting

## "Could not load manifests from serve URL"

- Make sure `heft start` is running
- Check that the serve URL matches your SPFx project's port (default: 4321)
- Accept the self-signed certificate in your browser first: visit `https://localhost:4321`
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

SPFx uses HTTPS with a self-signed certificate. You may need to:

1. Visit `https://localhost:4321` in your browser
2. Accept the security warning / add certificate exception
3. Refresh the workbench
