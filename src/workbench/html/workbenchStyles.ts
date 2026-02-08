// Workbench CSS Styles
// 
// This module generates the CSS styles for the workbench webview.

// Returns the complete CSS stylesheet for the workbench
export function getWorkbenchStyles(): string {
    return `
        * { box-sizing: border-box; }
        html {
            height: auto;
            overflow-y: auto;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #fff;
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
        }
        
        /* Top toolbar - SharePoint style */
        .workbench-toolbar {
            background: #fff;
            border-bottom: 1px solid #edebe9;
            padding: 8px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 48px;
        }
        
        .toolbar-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .toolbar-left button {
            background: none;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 14px;
            color: #323130;
            border-radius: 2px;
        }
        
        .toolbar-left button:hover {
            background: #f3f2f1;
        }
        
        .toolbar-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .toolbar-right button {
            background: none;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 13px;
            color: #605e5c;
            border-radius: 2px;
        }
        
        .toolbar-right button:hover {
            background: #f3f2f1;
            color: #323130;
        }
        
        .serve-url-input {
            padding: 4px 8px;
            border: 1px solid #c8c6c4;
            border-radius: 2px;
            font-size: 12px;
            width: 200px;
            color: #605e5c;
        }
        
        .serve-url-input:focus {
            outline: none;
            border-color: #0078d4;
        }
        
        /* Canvas area */
        .canvas {
            max-width: 1028px;
            margin: 0 auto;
            padding: 20px;
            min-height: calc(100vh - 96px);
        }
        
        .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px;
            color: #605e5c;
        }
        
        .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #edebe9;
            border-top-color: #0078d4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Add zone - the + button line */
        .add-zone {
            display: flex;
            align-items: center;
            padding: 12px 0;
            position: relative;
        }
        
        .add-zone-line {
            flex: 1;
            height: 1px;
            background: transparent;
            transition: background 0.2s;
        }
        
        .add-zone:hover .add-zone-line {
            background: #0078d4;
        }
        
        .add-zone-button {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 1px solid #c8c6c4;
            background: #fff;
            color: #0078d4;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            position: relative;
            z-index: 1;
        }
        
        .add-zone-button:hover {
            border-color: #0078d4;
            background: #0078d4;
            color: #fff;
            box-shadow: 0 2px 4px rgba(0,120,212,0.3);
        }
        
        /* Web part picker popup */
        .webpart-picker-popup {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            border: 1px solid #edebe9;
            border-radius: 4px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            padding: 16px;
            min-width: 300px;
            max-width: 400px;
            z-index: 100;
            display: none;
        }
        
        .webpart-picker-popup.open {
            display: block;
        }
        
        .picker-search {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #c8c6c4;
            border-radius: 2px;
            font-size: 14px;
            margin-bottom: 12px;
        }
        
        .picker-search:focus {
            outline: none;
            border-color: #0078d4;
        }
        
        .picker-results-label {
            font-size: 12px;
            color: #605e5c;
            margin-bottom: 8px;
        }
        
        .picker-results {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .picker-item {
            display: flex;
            align-items: center;
            padding: 10px 12px;
            cursor: pointer;
            border-radius: 2px;
            transition: background 0.1s;
        }
        
        .picker-item:hover {
            background: #f3f2f1;
        }
        
        .picker-item-icon {
            width: 32px;
            height: 32px;
            background: #f3f2f1;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-size: 16px;
            color: #0078d4;
        }
        
        .picker-item-text {
            font-size: 14px;
            color: #323130;
        }
        
        /* Web part container */
        .webpart-zone {
            position: relative;
            margin: 8px 0;
        }
        
        .webpart-container {
            background: #fff;
            border: 1px solid transparent;
            border-radius: 2px;
            min-height: 100px;
            position: relative;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .webpart-zone:hover .webpart-container {
            border-color: #0078d4;
        }
        
        .webpart-zone:hover .webpart-toolbar {
            opacity: 1;
        }
        
        .webpart-toolbar {
            position: absolute;
            top: -32px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            border: 1px solid #edebe9;
            border-radius: 2px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            padding: 4px;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
        }
        
        .webpart-toolbar button {
            background: none;
            border: none;
            padding: 4px 8px;
            cursor: pointer;
            color: #605e5c;
            font-size: 14px;
            border-radius: 2px;
        }
        
        .webpart-toolbar button:hover {
            background: #f3f2f1;
            color: #323130;
        }
        
        .webpart-content {
            padding: 16px;
            min-height: 80px;
        }
        
        /* Status bar */
        .status-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #fff;
            border-top: 1px solid #edebe9;
            padding: 6px 20px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #605e5c;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #107c10;
        }
        
        .status-dot.disconnected {
            background: #d13438;
        }
        
        .error-message {
            background: #fde7e9;
            border: 1px solid #f1707b;
            border-radius: 2px;
            padding: 12px 16px;
            color: #a80000;
            font-size: 14px;
        }
        
        /* Property pane */
        .property-pane {
            position: fixed;
            top: 0;
            right: 0;
            width: 320px;
            height: 100vh;
            background: #fff;
            box-shadow: -2px 0 8px rgba(0,0,0,0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 1000;
        }
        
        .property-pane.open {
            transform: translateX(0);
        }
        
        .property-pane-header {
            background: #0078d4;
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .property-pane-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .property-pane-content {
            padding: 16px;
            overflow-y: auto;
            height: calc(100vh - 52px);
        }
        
        .property-group {
            margin-bottom: 20px;
        }
        
        .property-group label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 6px;
            color: #323130;
        }
        
        .property-group input,
        .property-group textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #c8c6c4;
            border-radius: 2px;
            font-size: 14px;
        }
        
        .property-group input:focus,
        .property-group textarea:focus {
            outline: none;
            border-color: #0078d4;
        }
        
        .property-group textarea {
            min-height: 80px;
            resize: vertical;
        }
        
        /* Overlay for closing picker */
        .picker-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 50;
            display: none;
        }
        
        .picker-overlay.open {
            display: block;
        }
        
        /* Web part button */
        .webpart-btn {
            background: #0078d4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .webpart-btn:hover {
            background: #106ebe;
        }
        
        /* ============================================
         * PROPERTY PANE REACT COMPONENT STYLES
         * ============================================ */
        
        .pp-container {
            padding: 0;
        }
        
        .pp-empty {
            padding: 16px;
            color: #605e5c;
            text-align: center;
            font-style: italic;
        }
        
        .pp-page-header {
            padding: 0 0 16px 0;
            font-size: 14px;
            color: #605e5c;
            border-bottom: 1px solid #edebe9;
            margin-bottom: 16px;
        }
        
        .pp-group {
            margin-bottom: 20px;
        }
        
        .pp-group-header {
            font-size: 14px;
            font-weight: 600;
            color: #323130;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #edebe9;
        }
        
        .pp-group-fields {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .pp-group-collapsed .pp-group-fields {
            display: none;
        }
        
        .pp-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .pp-field-checkbox,
        .pp-field-toggle {
            flex-direction: row;
            align-items: center;
        }
        
        .pp-label {
            font-size: 14px;
            font-weight: 600;
            color: #323130;
        }
        
        .pp-required {
            color: #a80000;
        }
        
        .pp-description {
            font-size: 12px;
            color: #605e5c;
            margin-top: 4px;
        }
        
        .pp-field-description {
            font-size: 12px;
            color: #605e5c;
            margin-top: 4px;
        }
        
        .pp-input,
        .pp-textarea,
        .pp-select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #c8c6c4;
            border-radius: 2px;
            font-size: 14px;
            font-family: inherit;
            background: #fff;
            color: #323130;
        }
        
        .pp-input:focus,
        .pp-textarea:focus,
        .pp-select:focus {
            outline: none;
            border-color: #0078d4;
        }
        
        .pp-input:disabled,
        .pp-textarea:disabled,
        .pp-select:disabled {
            background: #f3f2f1;
            color: #a19f9d;
            cursor: not-allowed;
        }
        
        .pp-textarea {
            min-height: 80px;
            resize: vertical;
        }
        
        .pp-select {
            cursor: pointer;
        }
        
        .pp-select-header {
            font-weight: 600;
            color: #605e5c;
        }
        
        /* Checkbox styles */
        .pp-checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 14px;
            color: #323130;
        }
        
        .pp-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #0078d4;
        }
        
        .pp-checkbox:disabled {
            cursor: not-allowed;
        }
        
        /* Toggle styles */
        .pp-toggle-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #323130;
        }
        
        .pp-toggle-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .pp-toggle {
            position: relative;
            width: 40px;
            height: 20px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: background-color 0.2s;
            padding: 0;
        }
        
        .pp-toggle-off {
            background-color: #c8c6c4;
        }
        
        .pp-toggle-on {
            background-color: #0078d4;
        }
        
        .pp-toggle:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .pp-toggle-thumb {
            position: absolute;
            top: 2px;
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            transition: left 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .pp-toggle-off .pp-toggle-thumb {
            left: 2px;
        }
        
        .pp-toggle-on .pp-toggle-thumb {
            left: 22px;
        }group-label {
            font-size: 14px;
            font-weight: 600;
            color: #323130;
            margin-bottom: 8px;
        }
        
        .pp-radio-label {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 0;
            cursor: pointer;
            font-size: 14px;
            color: #323130;
        }
        
        .pp-radio-label input[type="radio"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #0078d4;
        }
        
        .pp-choice
        
        .pp-toggle-text {
            font-size: 14px;
            color: #323130;
        }
        
        /* Choice group styles */
        .pp-choice-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .pp-choice-option {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border: 1px solid #c8c6c4;
            border-radius: 2px;
            cursor: pointer;
            transition: border-color 0.2s, background-color 0.2s;
        }
        
        .pp-choice-option:hover {
            background: #f3f2f1;
        }
        
        .pp-choice-selected {
            border-color: #0078d4;
            background: #f0f6fc;
        }
        
        .pp-choice-option input[type="radio"] {
            accent-color: #0078d4;
        }
        
        .pp-choice-image {
            max-width: 48px;
            max-height: 48px;
        }
        
        .pp-choice-text {
            font-size: 14px;
            color: #323130;
        }
        
        /* Slider styles */
        .pp-slider-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .pp-slider {
            flex: 1;
            height: 4px;
            -webkit-appearance: none;
            appearance: none;
            background: #c8c6c4;
            border-radius: 2px;
            outline: none;
        }
        
        .pp-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #0078d4;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .pp-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #0078d4;
            border-radius: 50%;
            cursor: pointer;
            border: none;
        }
        
        .pp-slider:disabled {
            opacity: 0.5;
        }
        
        .pp-slider-value {
            font-size: 14px;
            font-weight: 600;
            color: #323130;
            min-width: 40px;
            text-align: right;
        }
        
        /* Button styles */
        .pp-button {
            padding: 8px 16px;
            border: 1px solid #c8c6c4;
            border-radius: 2px;
            background: #fff;
            color: #323130;
            font-size: 14px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: background-color 0.2s;
        }
        
        .pp-button:hover {
            background: #f3f2f1;
        }
        
        .pp-button-primary {
            background: #0078d4;
            border-color: #0078d4;
            color: #fff;
        }
        
        
        /* Horizontal rule */
        .pp-hr {
            border: none;
            border-top: 1px solid #edebe9;
            margin: 16px 0;
        }
        
        /* Empty state */
        .pp-empty {
            padding: 32px 16px;
            text-align: center;
            color: #605e5c;
            font-size: 14px;
        }
        .pp-button-primary:hover {
            background: #106ebe;
        }
        
        .pp-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .pp-button-icon {
            font-size: 16px;
        }
        
        /* Link styles */
        .pp-link {
            color: #0078d4;
            text-decoration: none;
            font-size: 14px;
        }
        
        .pp-link:hover {
            text-decoration: underline;
            color: #004578;
        }
        
        /* ============================================
         * APPLICATION CUSTOMIZER PLACEHOLDER STYLES
         * ============================================ */
        
        /* Header placeholder zone */
        .app-customizer-zone {
            position: relative;
            width: 100%;
        }
        
        .app-customizer-header {
            border-bottom: 1px dashed transparent;
            min-height: 0;
            transition: min-height 0.2s, border-color 0.2s;
        }
        
        .app-customizer-header:not(:empty) {
            min-height: 4px;
        }
        
        .app-customizer-header-content:not(:empty) {
            /* content rendered by the extension */
        }
        

        
        /* Extension wrapper with toolbar */
        .app-customizer-extension-wrapper {
            position: relative;
        }
        
        .app-customizer-extension-wrapper:hover .app-customizer-extension-toolbar {
            opacity: 1;
        }
        
        .app-customizer-extension-toolbar {
            position: absolute;
            top: 4px;
            right: 8px;
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(255,255,255,0.92);
            border: 1px solid #edebe9;
            border-radius: 2px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
            padding: 2px 6px;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
        }
        
        .app-customizer-extension-label {
            font-size: 11px;
            color: #605e5c;
            padding-right: 4px;
        }
        
        /* Add Extension zone - similar to web part add zone */
        .app-customizer-add-zone {
            display: flex;
            align-items: center;
            padding: 8px 20px;
            position: relative;
        }
        
        .app-customizer-add-zone .add-zone-line {
            flex: 1;
            height: 1px;
            background: transparent;
            transition: background 0.2s;
        }
        
        .app-customizer-add-zone:hover .add-zone-line {
            background: #0078d4;
        }
        
        /* Extension picker popup */
        .extension-picker-popup {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            border: 1px solid #edebe9;
            border-radius: 4px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            padding: 16px;
            min-width: 300px;
            max-width: 400px;
            z-index: 100;
            display: none;
        }
        
        
        .extension-picker-popup.open {
            display: block;
        }
        
        /* Hover label badge for extension zone */
        .app-customizer-header:hover::before {
            position: absolute;
            left: 8px;
            top: 0;
            font-size: 10px;
            color: #fff;
            background: #0078d4;
            padding: 2px 6px;
            border-radius: 2px;
            z-index: 5;
            pointer-events: none;
            content: 'Application Customizer';
        }
    `;
}
