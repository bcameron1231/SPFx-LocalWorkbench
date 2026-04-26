import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

// theme.json is written by the extension with VS Code colors before Storybook starts.
// At compile time the file is an empty stub, so we cast to suppress type errors.
import themeJson from './theme.json';

const vsCodeTheme = themeJson as any;

// Build the Storybook theme. vsCodeTheme provides color/base values derived from
// the active VS Code theme. Values defined below always win (spread last).
// When theme.json is empty (colors unavailable), Storybook uses its own defaults.
const customTheme = create({
  ...vsCodeTheme,

  // Typography — always Segoe UI to match SPFx, regardless of VS Code theme.
  fontBase: '"Segoe UI", "Segoe UI Web", Arial, sans-serif',
  // Code font comes from theme.json (user's VS Code editor font). Falls back to
  // Storybook's default when not present.
  ...(vsCodeTheme.fontCode ? { fontCode: vsCodeTheme.fontCode } : {}),

  // Branding — always fixed.
  // brandTitle: 'SPFx Local Workbench Storybook',
  // brandUrl: 'https://github.com/bcameron1231/SPFx-LocalWorkbench',
  // brandImage: undefined,
  // brandTarget: '_blank',
});

addons.setConfig({
  theme: customTheme,
  sidebar: {
    collapsedRoots: [],
  },
  enableShortcuts: true,
});

// Reduce tooltip delay via CSS custom property
// Storybook uses CSS transitions for tooltips with a default delay
const style = document.createElement('style');
style.innerHTML = `
  /* Reduce Storybook tooltip delay from 1000ms to 200ms */
  :root {
    --sb-tooltip-delay: 200ms !important;
  }
  
  /* Target tooltip elements directly if custom property doesn't work */
  [role="tooltip"],
  [data-radix-popper-content-wrapper],
  .os-tooltip {
    transition-delay: 200ms !important;
  }
`;
document.head.appendChild(style);

// --- VS Code context detection ---
// The Storybook manager is the top-level window when opened in a browser.
// When loaded inside VS Code, the extension embeds it in a cross-origin iframe, so
// `window !== window.top` is a zero-dependency, zero-timing-risk way to detect VS Code.
// This avoids the previous approach of waiting for a `spfx:vscodeContext` postMessage,
// which arrived before manager.ts's listener was registered (Storybook loads async).
if (window !== window.top) {
  // --- Clipboard helpers ---
  /** Returns selected text from the focused input or the document selection. */
  const getSelectedText = (): string => {
    const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      return el.value.substring(el.selectionStart ?? 0, el.selectionEnd ?? 0);
    }
    return window.getSelection()?.toString() ?? '';
  };

  /** Removes and returns selected text from the focused input. */
  const cutSelectedText = (): string => {
    const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const text = el.value.substring(start, end);
      if (start !== end) {
        el.value = el.value.slice(0, start) + el.value.slice(end);
        el.selectionStart = el.selectionEnd = start;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return text;
    }
    const sel = window.getSelection()?.toString() ?? '';
    if (sel) {
      document.execCommand('delete');
    }
    return sel;
  };

  // --- Context menu state ---
  // Save the active element at right-click time so context menu actions can
  // operate on it even after focus shifts to the context menu overlay.
  let contextMenuActiveEl: HTMLElement | null = null;

  const getPreviewFrame = (): HTMLIFrameElement | null =>
    (document.getElementById('storybook-preview-iframe') ??
      document.querySelector('iframe')) as HTMLIFrameElement | null;

  // --- Focus tracking ---
  // Track whether the user's focus is in the manager UI or the preview canvas.
  // Used when the VS Code keybinding fallback fires (after clicking the panel title)
  // to route paste to the correct frame without double-pasting.
  //
  // Two signals update this:
  //   1. `focusin` on the manager document: when an IFRAME element gets focus, the
  //      canvas is active; any other element means manager UI is active.
  //   2. `spfx:previewFocused` from preview.ts: canvas input explicitly notifies us.
  let lastActiveFrame: 'manager' | 'preview' = 'manager';

  document.addEventListener(
    'focusin',
    (e: FocusEvent) => {
      lastActiveFrame = (e.target as HTMLElement).tagName === 'IFRAME' ? 'preview' : 'manager';
    },
    true,
  );

  // --- Relay spfx:vscodeContext to the preview iframe ---
  // preview.ts detects VS Code context synchronously via window.top cross-origin check,
  // but we still send this as a belt-and-suspenders fallback for any edge cases.
  // Re-send on each `load` because Storybook reloads the preview iframe per story.
  const relayContextToPreview = (frame: HTMLIFrameElement) => {
    frame.contentWindow?.postMessage({ type: 'spfx:vscodeContext' }, '*');
    frame.addEventListener('load', () => {
      frame.contentWindow?.postMessage({ type: 'spfx:vscodeContext' }, '*');
    });
  };

  const initialPreviewFrame = getPreviewFrame();
  if (initialPreviewFrame) {
    relayContextToPreview(initialPreviewFrame);
  } else {
    const observer = new MutationObserver((_m, obs) => {
      const frame = getPreviewFrame();
      if (frame) {
        obs.disconnect();
        relayContextToPreview(frame);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // --- Context menu interception ---
  // Prevent the browser/VS Code default context menu and show our custom one instead,
  // which correctly routes actions back through the clipboard relay chain.
  document.addEventListener(
    'contextmenu',
    (e: MouseEvent) => {
      // Let the preview iframe handle its own context menu via its own listener;
      // events don't cross iframe boundaries so this fires only for manager UI elements.
      e.preventDefault();
      contextMenuActiveEl = document.activeElement as HTMLElement;
      const el = contextMenuActiveEl as HTMLInputElement | HTMLTextAreaElement;
      const hasSelection =
        el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
          ? (el.selectionStart ?? 0) !== (el.selectionEnd ?? 0)
          : !!window.getSelection()?.toString();
      const isEditable = !!(
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        (contextMenuActiveEl as HTMLElement).isContentEditable
      );
      window.parent.postMessage(
        {
          type: 'spfx:contextMenu',
          target: 'manager',
          x: e.clientX,
          y: e.clientY,
          hasSelection,
          isEditable,
        },
        '*',
      );
    },
    true,
  );

  // --- Keyboard interception ---
  // Shortcuts that need relay (clipboard blocked in VS Code cross-origin iframes):
  //   CMD+V/CTRL+V  paste    — relay clipboard read via extension
  //   CMD+C/CTRL+C  copy     — relay clipboard write via extension
  //   CMD+X/CTRL+X  cut      — relay clipboard write via extension
  // Shortcuts handled directly (no clipboard access needed):
  //   CMD+A/CTRL+A  select-all
  //   CMD+Z/CTRL+Z  undo
  //   CMD+Shift+Z (Mac) / Ctrl+Shift+Z / Ctrl+Y (Windows) — redo
  // Platform detection: Mac uses CMD (metaKey); Windows uses Ctrl (ctrlKey).
  // We never treat Ctrl as a shortcut modifier on Mac — those are separate OS-level bindings.
  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      const isShortcut = isMac ? e.metaKey : e.ctrlKey;
      if (!isShortcut) {
        return;
      }
      const key = e.key.toLowerCase();
      // y (Ctrl+Y redo) is a Windows-only convention; CMD+Y has no standard meaning on Mac.
      if (!['v', 'c', 'x', 'a', 'z', ...(!isMac ? ['y'] : [])].includes(key)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      switch (key) {
        case 'v':
          window.parent.postMessage({ type: 'spfx:clipboardRequest', target: 'manager' }, '*');
          break;
        case 'c': {
          const text = getSelectedText();
          if (text) window.parent.postMessage({ type: 'spfx:clipboardWrite', text }, '*');
          break;
        }
        case 'x': {
          const text = cutSelectedText();
          if (text) window.parent.postMessage({ type: 'spfx:clipboardWrite', text }, '*');
          break;
        }
        case 'a':
          document.execCommand('selectAll');
          break;
        case 'z':
          document.execCommand(e.shiftKey ? 'redo' : 'undo');
          break;
        case 'y':
          document.execCommand('redo');
          break;
      }
    },
    true,
  );

  // --- Message handling ---
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as {
      type?: string;
      text?: string;
      target?: string;
      x?: number;
      y?: number;
      hasSelection?: boolean;
      isEditable?: boolean;
      cmd?: string;
    } | null;
    if (!data || typeof data !== 'object') {
      return;
    }

    if (data.type === 'spfx:previewFocused') {
      lastActiveFrame = 'preview';
      return;
    }

    // Relay clipboard/context requests from the preview frame up to the outer webview.
    if (data.type === 'spfx:clipboardRequest' && data.target === 'preview') {
      window.parent.postMessage(data, '*');
      return;
    }
    if (data.type === 'spfx:clipboardWrite') {
      // Relay copy/cut result from preview up to the outer webview.
      window.parent.postMessage(data, '*');
      return;
    }
    if (data.type === 'spfx:contextMenu' && data.target === 'preview') {
      // Adjust the preview-relative mouse coordinates to manager document coordinates.
      const pf = getPreviewFrame();
      const rect = pf?.getBoundingClientRect();
      window.parent.postMessage(
        {
          ...data,
          x: (data.x ?? 0) + (rect?.left ?? 0),
          y: (data.y ?? 0) + (rect?.top ?? 0),
        },
        '*',
      );
      return;
    }

    if (data.type === 'spfx:paste' && typeof data.text === 'string') {
      const target = data.target ?? lastActiveFrame;
      if (target === 'manager') {
        // Restore focus to the element that initiated the paste (context menu or CMD+V/CTRL+V).
        if (contextMenuActiveEl) {
          contextMenuActiveEl.focus();
        }
        document.execCommand('insertText', false, data.text);
      } else {
        getPreviewFrame()?.contentWindow?.postMessage(data, '*');
      }
      return;
    }

    if (data.type === 'spfx:selectAll') {
      const target = data.target ?? lastActiveFrame;
      if (target === 'manager') {
        document.execCommand('selectAll');
      } else {
        getPreviewFrame()?.contentWindow?.postMessage(data, '*');
      }
      return;
    }

    // Context menu command dispatched from the outer webview overlay.
    if (data.type === 'spfx:contextCmd') {
      const target =
        data.cmd === 'paste' ? (data.target ?? lastActiveFrame) : (data.target ?? 'manager');

      if (target === 'preview') {
        // Forward to the canvas; preview.ts handles it.
        getPreviewFrame()?.contentWindow?.postMessage(data, '*');
        return;
      }

      // Handle in the manager frame.
      switch (data.cmd) {
        case 'copy': {
          // Use the saved element so focus doesn't need to be restored for reads.
          const saved = contextMenuActiveEl as HTMLInputElement | HTMLTextAreaElement | null;
          const text =
            saved && (saved.tagName === 'INPUT' || saved.tagName === 'TEXTAREA')
              ? saved.value.substring(saved.selectionStart ?? 0, saved.selectionEnd ?? 0)
              : (window.getSelection()?.toString() ?? '');
          if (text) window.parent.postMessage({ type: 'spfx:clipboardWrite', text }, '*');
          break;
        }
        case 'cut': {
          if (contextMenuActiveEl) {
            contextMenuActiveEl.focus();
          }
          const text = cutSelectedText();
          if (text) window.parent.postMessage({ type: 'spfx:clipboardWrite', text }, '*');
          break;
        }
        case 'paste':
          // Focus the saved element first so execCommand('insertText') lands in the
          // right place when the async clipboard response arrives.
          if (contextMenuActiveEl) {
            contextMenuActiveEl.focus();
          }
          window.parent.postMessage({ type: 'spfx:clipboardRequest', target: 'manager' }, '*');
          break;
        case 'selectAll':
          if (contextMenuActiveEl) {
            contextMenuActiveEl.focus();
          }
          document.execCommand('selectAll');
          break;
        case 'undo':
          if (contextMenuActiveEl) {
            contextMenuActiveEl.focus();
          }
          document.execCommand('undo');
          break;
        case 'redo':
          if (contextMenuActiveEl) {
            contextMenuActiveEl.focus();
          }
          document.execCommand('redo');
          break;
      }
    }
  });
}
