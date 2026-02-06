import type { IActiveWebPart } from '../types';
import { createElement, escapeHtml } from '../utils/domHelpers';
import { Picker } from './Picker';

export class CanvasRenderer {
    private canvasElement: HTMLElement | null;
    private picker: Picker;
    private onEditCallback: (index: number) => void;
    private onDeleteCallback: (index: number) => void;

    constructor(
        picker: Picker,
        onEditCallback: (index: number) => void,
        onDeleteCallback: (index: number) => void
    ) {
        this.canvasElement = document.getElementById('canvas');
        this.picker = picker;
        this.onEditCallback = onEditCallback;
        this.onDeleteCallback = onDeleteCallback;
    }

    render(activeWebParts: IActiveWebPart[], hasManifests: boolean): void {
        if (!this.canvasElement) return;

        if (!hasManifests) {
            this.canvasElement.innerHTML = '<div class="error-message">No web parts found. Make sure <code>heft start</code> is running.</div>';
            return;
        }

        // Clear canvas
        this.canvasElement.innerHTML = '';

        // Render first add zone
        const firstAddZone = this.picker.renderAddZone(0);
        this.canvasElement.appendChild(firstAddZone);

        // Render web parts and add zones
        activeWebParts.forEach((wp, index) => {
            const webPartZone = this.renderWebPartZone(wp, index);
            this.canvasElement!.appendChild(webPartZone);

            const addZone = this.picker.renderAddZone(index + 1);
            this.canvasElement!.appendChild(addZone);
        });

        // Attach event listeners to picker items
        this.picker.setupEventListeners();
        
        // Re-attach event listeners after rendering
        this.attachEventListeners();
    }

    private renderWebPartZone(_webPart: IActiveWebPart, index: number): HTMLElement {
        const zone = createElement('div', 'webpart-zone');

        const toolbar = createElement('div', 'webpart-toolbar');

        const editButton = createElement('button', '', {
            innerHTML: '✏️',
            attributes: { title: 'Edit properties' }
        });
        editButton.addEventListener('click', () => this.onEditCallback(index));

        const deleteButton = createElement('button', '', {
            innerHTML: '🗑️',
            attributes: { title: 'Delete' }
        });
        deleteButton.addEventListener('click', () => this.onDeleteCallback(index));

        toolbar.append(editButton, deleteButton);

        const container = createElement('div', 'webpart-container');
        const content = createElement('div', 'webpart-content');
        content.id = 'webpart-' + index;

        container.appendChild(content);
        zone.append(toolbar, container);

        return zone;
    }

    showError(message: string, serveUrl: string): void {
        if (!this.canvasElement) return;

        this.canvasElement.innerHTML = `
            <div class="error-message"><strong>Error:</strong> ${escapeHtml(message)}</div>
            <div class="webpart-picker">
                <h2>Troubleshooting</h2>
                <p>Make sure <code>heft start</code> is running at ${escapeHtml(serveUrl)}</p>
                <button class="webpart-btn" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }

    showLoading(message: string): void {
        if (!this.canvasElement) return;

        const loading = this.canvasElement.querySelector<HTMLElement>('#loading');
        const loadingStatus = document.getElementById('loading-status');
        
        if (loadingStatus) {
            loadingStatus.textContent = message;
        }
        
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading(): void {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    private attachEventListeners(): void {
        // Event listeners are now attached inline during element creation
        // This method can be used for any additional global listeners if needed
    }

    getWebPartElement(index: number): HTMLElement | null {
        return document.getElementById('webpart-' + index);
    }
}
