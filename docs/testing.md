# Testing changes

## Automated checks

Run from the repository root:

```bash
npm run compile   # packages, type-check, lint, bundles
npm test          # Vitest unit tests
```

Unit tests live next to the code (`*.test.ts`). Pure logic should get tests: the mock rule engine
(`src/workbench/proxy/MockRuleEngine.test.ts`) and the scenarios (`scenarios.test.ts`) are the examples to follow.

## Manual check in an Extension Development Host

1. Open this repository in VS Code and press **F5** (`Run Extension`, which starts `npm run watch`).
2. In the new window, open an SPFx project and start its dev server.
3. Run **SPFx Local Workbench: Open Local Workbench**, add a web part, and check:
   - the web part renders, and the property pane opens and re-renders it;
   - the theme picker changes its colours;
   - **Help > Toggle Developer Tools** (or **SPFx Local Workbench: Open Developer Tools**) shows no errors;
   - **View > Output > SPFx API Proxy** shows the requests you expect.
4. After editing webview code, reload the workbench (close and reopen it). After editing extension code, restart
   the Extension Development Host.

## Installing a local build in your own VS Code

```bash
npx vsce package --no-dependencies -o spfx-local-workbench-local.vsix
code --install-extension spfx-local-workbench-local.vsix --force
```

Then **fully restart VS Code** (close every window). A window reload keeps the old webview code cached. If you also
have the Marketplace version installed, turn off its auto-update so it doesn't replace your build.

## Testing with an AI agent

Agents can drive an isolated VS Code through the Chrome DevTools Protocol, without touching the user's own VS Code:

- Start VS Code with its own folders: `code --user-data-dir <tmp>/user --extensions-dir <tmp>/ext
  --remote-debugging-port=9333 <project folder>`, install the `.vsix` into that `--extensions-dir`.
- Connect to `http://localhost:9333/json`, find the webview target, and evaluate scripts in it (measure elements,
  read console errors, click controls). [`scripts/agent-cdp.mjs`](../scripts/agent-cdp.mjs) does this (Node 22+):
  `targets`, `cmd "<Command Palette title>"`, `eval "<js>"`, `shot <file.png>`, and `logs [text]` (with
  `USER_DATA_DIR` set) for the **SPFx API Proxy** output.
- The webview target is VS Code's wrapper page; the workbench is the `iframe` inside it
  (`document.querySelector('iframe').contentDocument`, `wb` in `agent-cdp.mjs eval`). Prefer DOM clicks there
  (`element.click()`) over mouse coordinates: the window's size and scale change.
- To add a web part: click the `+` button (text `+`), then the element whose text is the web part's title.
- After reinstalling the extension, kill and restart that VS Code: webview code is cached.
- Never sign in, enter credentials or accept consent for the user. When a sign-in is needed, ask the user to
  complete it in that window.
- When comparing with SharePoint, use a test page the user names, and don't click blindly on the page canvas:
  a stray click can add web parts, and SharePoint saves drafts automatically.
