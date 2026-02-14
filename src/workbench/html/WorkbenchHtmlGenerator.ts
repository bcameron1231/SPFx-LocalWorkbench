// Workbench HTML Generator
// 
// This module generates the complete HTML for the workbench webview.

import * as vscode from 'vscode';
import type {
    IThemeConfig,
    IContextConfig,
    IPageContextConfig
} from '../config/WorkbenchConfig';

// Configuration for generating the workbench HTML
export interface IHtmlGeneratorConfig {
    nonce: string;
    serveUrl: string;
    webPartsJson: string;
    extensionsJson?: string;
    cspSource: string;
    locale: string;
    webPartCount: number;
    extensionCount?: number;
    webview: vscode.Webview;
    extensionUri: vscode.Uri;
    // Theme settings from user configuration
    themeSettings?: IThemeConfig;
    // Context settings from user configuration
    contextSettings?: Partial<IContextConfig>;
    // Page context settings from user configuration
    pageContextSettings?: Partial<IPageContextConfig>;
}

// Generates the Content Security Policy for the webview
function generateCsp(config: IHtmlGeneratorConfig): string {
    return [
        `default-src 'none'`,
        `style-src ${config.cspSource} 'unsafe-inline' ${config.serveUrl}`,
        // Note: 'unsafe-eval' is still required for AMD module loader and SPFx bundles
        // 'nonce-${nonce}' allows our bundled script while blocking inline scripts
        `script-src 'nonce-${config.nonce}' 'unsafe-eval' ${config.cspSource} ${config.serveUrl}`,
        `connect-src ${config.serveUrl} https://*.sharepoint.com https://login.windows.net`,
        `img-src ${config.cspSource} ${config.serveUrl} https: data:`,
        `font-src ${config.cspSource} ${config.serveUrl} https: data:`,
        `frame-src ${config.serveUrl}`
    ].join('; ');
}

// Generates the HTML head section
function generateHead(config: IHtmlGeneratorConfig): string {
    const csp = generateCsp(config);
    
    // Get URI for the bundled CSS
    const webviewCssUri = config.webview.asWebviewUri(
        vscode.Uri.joinPath(config.extensionUri, 'dist', 'webview', 'webview.css')
    );
    
    return `
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPFx Local Workbench</title>
    <link rel="stylesheet" href="${webviewCssUri}">
    `;
}

// Generates the main content area (React root)
function generateMainContent(): string {
    return `
    <div id="root">
        <div class="loading" id="loading" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
            <div class="spinner"></div>
            <p id="loading-status">Initializing React...</p>
        </div>
    </div>
    `;
}

// Generates the status bar HTML
function generateStatusBar(webPartCount: number, extensionCount: number = 0, locale: string = 'en-us'): string {
    let countText = `${webPartCount} web part${webPartCount === 1 ? '' : 's'}`;
    if (extensionCount > 0) {
        countText += `, ${extensionCount} extension${extensionCount === 1 ? '' : 's'}`;
    }
    countText += ' detected';
    return `
    <div class="status-bar">
        <div class="status-indicator">
            <div class="status-dot" id="status-dot"></div>
            <span id="status-text">Initializing...</span>
        </div>
        <span id="component-count">${countText}</span>
        <div class="separator"></div>
        <span id="locale-switcher">${locale.toLowerCase()}</span>
    </div>
    `;
}

// Generates the scripts section HTML
function generateScripts(config: IHtmlGeneratorConfig): string {
    // Get URI for the bundled webview script
    const webviewScriptUri = config.webview.asWebviewUri(
        vscode.Uri.joinPath(config.extensionUri, 'dist', 'webview', 'webview.js')
    );

    // Parse web parts from JSON string
    const webParts = JSON.parse(config.webPartsJson);
    const extensions = config.extensionsJson ? JSON.parse(config.extensionsJson) : [];

    // Prepare configuration object to inject
    const workbenchConfig = {
        serveUrl: config.serveUrl,
        webParts: webParts,
        extensions: extensions,
        theme: config.themeSettings,
        context: config.contextSettings,
        pageContext: config.pageContextSettings
    };
    
    // Resolve local vendor UMD bundles shipped with the extension
    const reactUri = config.webview.asWebviewUri(
        vscode.Uri.joinPath(config.extensionUri, 'dist', 'webview', 'vendor', 'react.js')
    );
    const reactDomUri = config.webview.asWebviewUri(
        vscode.Uri.joinPath(config.extensionUri, 'dist', 'webview', 'vendor', 'react-dom.js')
    );
    const fluentUri = config.webview.asWebviewUri(
        vscode.Uri.joinPath(config.extensionUri, 'dist', 'webview', 'vendor', 'fluentui-react.js')
    );

    return `
    <!-- React 17.0.2 UMD - bundled locally (matches SPFx runtime) -->
    <script nonce="${config.nonce}" src="${reactUri}"></script>
    <script nonce="${config.nonce}" src="${reactDomUri}"></script>
    
    <!-- Fluent UI React v8 UMD - bundled locally (matches SPFx runtime) -->
    <script nonce="${config.nonce}" src="${fluentUri}"></script>
    
    <!-- Inject workbench configuration -->
    <script nonce="${config.nonce}">
        window.__workbenchConfig = ${JSON.stringify(workbenchConfig)};
    </script>
    
    <!-- Bundled workbench runtime -->
    <script nonce="${config.nonce}" src="${webviewScriptUri}"></script>
    `;
}

// Generates the complete workbench HTML document
export function generateWorkbenchHtml(config: IHtmlGeneratorConfig): string {
    const head = generateHead(config);
    // Toolbar is now part of React App component, not static HTML
    const mainContent = generateMainContent();
    const statusBar = generateStatusBar(config.webPartCount, config.extensionCount || 0, config.locale);
    const scripts = generateScripts(config);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    ${head}
</head>
<body>
    ${mainContent}
    ${statusBar}
    ${scripts}
</body>
</html>`;
}

// Generates an error HTML page
export function generateErrorHtml(errorMessage: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPFx Local Workbench - Error</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f3f2f1;
        }
        .error-box {
            background: #fde7e9;
            border: 1px solid #f1707b;
            border-radius: 4px;
            padding: 24px;
            max-width: 600px;
            text-align: center;
        }
        h2 { color: #a80000; margin: 0 0 16px 0; }
        p { color: #323130; margin: 0; }
    </style>
</head>
<body>
    <div class="error-box">
        <h2>⚠️ Workbench Error</h2>
        <p>${errorMessage}</p>
    </div>
</body>
</html>`;
}
