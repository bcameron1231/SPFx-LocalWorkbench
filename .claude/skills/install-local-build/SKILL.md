---
name: install-local-build
description: Package the SPFx Local Workbench extension as a .vsix and install it in VS Code (the user's, or an isolated test instance). Use when asked to try the extension in a real VS Code or to update the installed fork.
---

# Package and install a local build

1. Run the `verify-change` checks first; packaging runs a production build and fails on type or lint errors.
2. Package: `npx vsce package --no-dependencies -o spfx-local-workbench-local.vsix`
   (`*.vsix` is gitignored; never commit it).
3. Install:
   - **The user's VS Code** (only when they asked): `code --install-extension spfx-local-workbench-local.vsix --force`.
     Tell them to close **every** VS Code window and reopen it: a window reload keeps the old webview code cached.
     If the Marketplace version is also installed, they should turn off its auto-update.
   - **An isolated instance** (for agent testing): `code --user-data-dir <tmp>/user --extensions-dir <tmp>/ext
     --install-extension spfx-local-workbench-local.vsix --force`, then start it with the same two folders and
     `--remote-debugging-port=9333`. Kill and restart it after every reinstall.
4. Features that need an account sign-in are completed by the user themselves. Never sign in, type credentials or
   accept consent on their behalf.

Report: the .vsix path and version, where it was installed, and whether VS Code still needs a full restart.
