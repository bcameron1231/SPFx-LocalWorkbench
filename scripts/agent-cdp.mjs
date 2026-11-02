// Drives an isolated VS Code started with --remote-debugging-port (see docs/testing.md, "Testing with an AI agent").
// Node 22+ (global fetch and WebSocket). Port: CDP_PORT, default 9333.
//
//   node scripts/agent-cdp.mjs targets                       list debuggable targets
//   node scripts/agent-cdp.mjs cmd "<command title>"         run a command from the Command Palette
//   node scripts/agent-cdp.mjs eval "<js>"                   evaluate in the workbench page (the webview's inner
//                                                            document is `wb`; top-level await allowed)
//   node scripts/agent-cdp.mjs shot <file.png>               screenshot the VS Code window
//   node scripts/agent-cdp.mjs logs [pattern]                print SPFx API Proxy log lines (needs USER_DATA_DIR)
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , mode, arg] = process.argv;
const port = process.env.CDP_PORT ?? '9333';

if (mode === 'logs') {
  // VS Code writes output channels to <user-data-dir>/logs/<session>/window1/exthost/output_logging_*/
  const logs = join(process.env.USER_DATA_DIR ?? '', 'logs');
  const session = readdirSync(logs).sort().pop();
  const exthost = join(logs, session, 'window1', 'exthost');
  for (const dir of readdirSync(exthost).filter((d) => d.startsWith('output_logging_'))) {
    for (const file of readdirSync(join(exthost, dir)).filter((f) => f.includes('SPFx API Proxy'))) {
      const lines = readFileSync(join(exthost, dir, file), 'utf8').split('\n');
      console.log(lines.filter((l) => !arg || l.includes(arg)).join('\n'));
    }
  }
  process.exit(0);
}

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
if (mode === 'targets') {
  for (const t of targets) console.log(`${t.type}\t${t.title.slice(0, 50)}\t${t.url.slice(0, 100)}`);
  process.exit(0);
}

// The workbench webview is an iframe target whose URL contains the extension ID; the window is the 'page' target
const isWebview = mode === 'eval';
const target = targets.find((t) =>
  isWebview ? t.type === 'iframe' && t.url.includes('pnp-spfx-local-workbench') : t.type === 'page',
);
if (!target) {
  console.error(isWebview ? 'Workbench webview not found: open the Local Workbench first' : 'VS Code window not found');
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const data = JSON.parse(m.data);
  pending.get(data.id)?.(data);
  pending.delete(data.id);
};
await new Promise((resolve) => (ws.onopen = resolve));
const send = (method, params = {}) =>
  new Promise((resolve) => {
    pending.set(++id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const key = async (keyName, code, keyCode, modifiers = 0) => {
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', { type, key: keyName, code, windowsVirtualKeyCode: keyCode, modifiers });
  }
};

if (mode === 'eval') {
  // The webview target hosts VS Code's wrapper page; the workbench itself is its inner iframe
  const expression = `(async () => { const wb = document.querySelector('iframe')?.contentDocument; return (${arg}); })()`;
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  const { result: value, exceptionDetails } = result.result;
  console.log(exceptionDetails ? `Error: ${exceptionDetails.exception?.description}` : JSON.stringify(value.value, null, 1));
} else if (mode === 'cmd') {
  await key('P', 'KeyP', 80, 10); // Ctrl+Shift+P
  await sleep(500);
  await send('Input.insertText', { text: arg });
  await sleep(800);
  await key('Enter', 'Enter', 13);
} else if (mode === 'shot') {
  const result = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(arg, Buffer.from(result.result.data, 'base64'));
  console.log(`${arg} (${statSync(arg).size} bytes)`);
} else {
  console.error('Usage: see the comment at the top of scripts/agent-cdp.mjs');
}
ws.close();
