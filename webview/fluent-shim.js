// Fluent UI Shim for esbuild
// Maps @fluentui/react imports in the extension's own webview code to a
// private global. This allows the extension to use Fluent UI React v8 for its own UI without conflicts
module.exports = window.__ExtFluentUI;
