/**
 * Storybook preview configuration for SPFx addon
 * This file is loaded in the preview iframe and provides decorators
 */
import { DEFAULT_THEME_NAME } from '@spfx-local-workbench/shared';

import { DisplayMode, STORYBOOK_GLOBAL_KEYS } from './constants';
import { withSpfx } from './decorators/withSpfx';
// Global preview-frame styles — makes the canvas body background react to the
// SPFx palette CSS vars that withSpfx sets on document.body on every theme change.
import './preview.css';

export const decorators = [withSpfx];

export const globalTypes = {
  [STORYBOOK_GLOBAL_KEYS.DISPLAY_MODE]: {
    defaultValue: DisplayMode.Edit,
  },
  [STORYBOOK_GLOBAL_KEYS.THEME]: {
    defaultValue: DEFAULT_THEME_NAME,
  },
};

export const parameters = {
  spfx: {
    // Default SPFx parameters
    serveUrl: 'https://localhost:4321',
    displayMode: 2, // Edit mode by default
    locale: 'en-US',
    showPropertyPane: false,
  },
};

// Clipboard and selection relay for VS Code webview context.
// When running inside VS Code, the clipboard API is blocked in nested cross-origin iframes.
// We intercept CMD+C/V/X/A/Z and relay clipboard operations via the extension API.
if (typeof window !== 'undefined') {
  // Detect VS Code context synchronously by probing window.top.
  // In VS Code, window.top is the outer vscode-webview:// context (cross-origin),
  // so accessing its properties throws a SecurityError.
  // In a regular browser, window.top is http://localhost:6006 (same-origin), no error.
  let isVSCodeContext = false;
  try {
    void window.top?.location.href;
  } catch {
    isVSCodeContext = true;
  }

  if (isVSCodeContext) {
    // Save the focused element at CMD+V / right-click time so async responses (the
    // clipboard relay round-trip) target the correct input even if focus has shifted.
    let pendingPasteTarget: HTMLElement | null = null;
    let contextMenuActiveEl: HTMLElement | null = null;

    // --- Clipboard helpers ---
    const getSelectedText = (): string => {
      const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        return el.value.substring(el.selectionStart ?? 0, el.selectionEnd ?? 0);
      }
      return window.getSelection()?.toString() ?? '';
    };

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

    // --- Focus notification ---
    // When a canvas editable element gains focus, notify the manager frame so it can
    // update `lastActiveFrame`. This ensures the VS Code keybinding fallback (CMD+V
    // after clicking the panel title) routes to the canvas, not the Storybook UI.
    document.addEventListener(
      'focusin',
      (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          window.parent.postMessage({ type: 'spfx:previewFocused' }, '*');
        }
      },
      true,
    );

    // --- Context menu interception ---
    document.addEventListener(
      'contextmenu',
      (e: MouseEvent) => {
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
          contextMenuActiveEl.isContentEditable
        );
        // Relay to manager, which adjusts coordinates and relays to the outer webview.
        window.parent.postMessage(
          {
            type: 'spfx:contextMenu',
            target: 'preview',
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
    //   CMD+V  paste    — relay clipboard read via extension
    //   CMD+C  copy     — relay clipboard write via extension
    //   CMD+X  cut      — relay clipboard write via extension
    // Shortcuts handled directly (no clipboard access needed):
    //   CMD+A  select-all
    //   CMD+Z  undo
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
            pendingPasteTarget = document.activeElement as HTMLElement;
            window.parent.postMessage({ type: 'spfx:clipboardRequest', target: 'preview' }, '*');
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

    window.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        text?: string;
        target?: string;
        cmd?: string;
      } | null;
      if (!data || typeof data !== 'object') {
        return;
      }

      if (
        data.type === 'spfx:paste' &&
        data.target === 'preview' &&
        typeof data.text === 'string'
      ) {
        const el = pendingPasteTarget ?? (document.activeElement as HTMLElement);
        pendingPasteTarget = null;
        if (el) {
          el.focus();
        }
        // execCommand('insertText') fires synthetic input events that React observes.
        document.execCommand('insertText', false, data.text);
        return;
      }

      if (data.type === 'spfx:selectAll' && data.target === 'preview') {
        document.execCommand('selectAll');
        return;
      }

      // Context menu command dispatched from the outer webview overlay.
      if (data.type === 'spfx:contextCmd' && data.target === 'preview') {
        switch (data.cmd) {
          case 'copy': {
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
            // Focus the saved element before the async clipboard round-trip so that
            // execCommand('insertText') lands in the right input when the response arrives.
            if (contextMenuActiveEl) {
              contextMenuActiveEl.focus();
            }
            pendingPasteTarget = contextMenuActiveEl;
            window.parent.postMessage({ type: 'spfx:clipboardRequest', target: 'preview' }, '*');
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
}
