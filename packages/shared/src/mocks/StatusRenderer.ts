/**
 * StatusRenderer - Mock implementation matching Microsoft's ClientSideWebPartStatusRenderer
 * @copyright Microsoft Corporation. All rights reserved.
 */
import styles from './StatusRenderer.module.css';
import { StatusRendererStrings } from './StatusRendererStrings';

/**
 * Callback to clear the dom node.
 */
export type ClearDomElementCallback = (domElement: Element) => void;

/**
 * Options for rendering error messages
 */
export interface IRenderErrorOptions {
  clearDomElementCallback?: ClearDomElementCallback;
  message?: string;
}

/**
 * Cache entry for tracking active indicators per domElement
 */
interface ICacheEntry {
  loadingTimer?: number;
  placeholder?: HTMLElement;
  isErrorBeingRendered: boolean;
}

/**
 * Mock implementation of IClientSideWebPartStatusRenderer
 * Provides loading indicators and error messages for web parts
 */
export class StatusRenderer {
  private readonly _errorId = 'cswp-error';
  private readonly _activeIndicatorCache = new WeakMap<Element, ICacheEntry>();

  /**
   * Display a loading spinner.
   * @param domElement - the web part container div.
   * @param loadingMessage - the message to be displayed when the loading spinner is displayed.
   * @param timeout - (optional) timeout to render the loading indicator. Default is 1500ms.
   * @param clearDomElementCallback - (optional) callback to clear the dom element.
   */
  public displayLoadingIndicator(
    domElement: Element,
    loadingMessage: string,
    timeout?: number,
    clearDomElementCallback?: ClearDomElementCallback,
  ): void {
    this._createLoadingIndicator(domElement, loadingMessage, timeout, clearDomElementCallback);
  }

  /**
   * Clear the loading indicator.
   * @param domElement - the web part container div.
   */
  public clearLoadingIndicator(domElement: Element): void {
    if (!domElement) {
      return;
    }

    if (this._activeIndicatorCache.has(domElement)) {
      const cacheEntry = this._getCacheEntry(domElement);

      if (cacheEntry.loadingTimer) {
        window.clearTimeout(cacheEntry.loadingTimer);
      }

      if (cacheEntry.placeholder && cacheEntry.placeholder.parentElement) {
        cacheEntry.placeholder.parentElement.removeChild(cacheEntry.placeholder);
      }

      this._activeIndicatorCache.delete(domElement);
    }
  }

  /**
   * Render the provided error message in the web part container div.
   * @param domElement - the web part container div.
   * @param error - the error message.
   * @param options - (optional) additional options or clearDomElementCallback for backwards compatibility.
   */
  public renderError(
    domElement: HTMLElement,
    error: Error | string,
    options?: IRenderErrorOptions | ClearDomElementCallback,
  ): void {
    // Handle backwards compatibility - options could be a function
    if (typeof options === 'function') {
      options = { clearDomElementCallback: options };
    }

    this._renderError(domElement, error, options);
  }

  /**
   * Clear the web part error message.
   * @param domElement - the web part container div.
   */
  public clearError(domElement: HTMLElement): void {
    if (!domElement) {
      return;
    }

    if (!this._activeIndicatorCache.has(domElement)) {
      return;
    }

    const cacheEntry = this._activeIndicatorCache.get(domElement);
    if (cacheEntry && cacheEntry.isErrorBeingRendered) {
      cacheEntry.isErrorBeingRendered = false;

      const divErr = domElement.querySelector(`div[data-sp-id='${this._errorId}']`);
      if (divErr) {
        (divErr as HTMLElement).style.display = 'none';
        divErr.removeAttribute('data-automation-id');
      }
    }
  }

  /**
   * Create and schedule the loading indicator
   */
  private _createLoadingIndicator(
    domElement: Element,
    loadingMessage: string,
    timeout?: number,
    clearDomElementCallback?: ClearDomElementCallback,
  ): void {
    if (!domElement) {
      return;
    }

    if (!timeout || isNaN(timeout)) {
      timeout = 1500; // milliseconds
    }

    const cacheEntry = this._getCacheEntry(domElement);

    // Clear any earlier loading timer
    if (cacheEntry.loadingTimer) {
      window.clearTimeout(cacheEntry.loadingTimer);
    }

    // Delay display of loading indicator
    cacheEntry.loadingTimer = window.setTimeout(() => {
      this._showLoadingIndicator(domElement, loadingMessage, clearDomElementCallback);
    }, timeout);
  }

  /**
   * Show the loading indicator
   */
  private _showLoadingIndicator(
    domElement: Element,
    loadingMessage: string,
    clearDomElementCallback?: ClearDomElementCallback,
  ): void {
    this._renderLoadingIndicator(domElement, loadingMessage, clearDomElementCallback);
  }

  /**
   * Render the loading indicator element
   */
  private _renderLoadingIndicator(
    domElement: Element,
    loadingMessage: string,
    clearDomElementCallback?: ClearDomElementCallback,
  ): void {
    if (!this._activeIndicatorCache.has(domElement)) {
      return;
    }

    const cacheEntry = this._getCacheEntry(domElement);

    // Error is being rendered, don't render loading indicator
    if (cacheEntry.isErrorBeingRendered) {
      return;
    }

    cacheEntry.placeholder = this._createLoadingIndicatorElement(
      domElement as HTMLElement,
      loadingMessage,
      clearDomElementCallback,
    );
  }

  /**
   * Create the loading indicator DOM element
   */
  private _createLoadingIndicatorElement(
    domElement: HTMLElement,
    loadingMessage: string,
    clearDomElementCallback?: ClearDomElementCallback,
  ): HTMLElement {
    if (clearDomElementCallback) {
      clearDomElementCallback(domElement);
    }
    this._clearChildren(domElement);

    const titleMessage = StatusRendererStrings.LoadingStatus(loadingMessage);
    const spinnerElement = this._createSpinnerElement(titleMessage);
    spinnerElement.style.display = 'block';

    return domElement.appendChild(spinnerElement);
  }

  /**
   * Create the spinner element with SVG
   */
  private _createSpinnerElement(titleMessage: string): HTMLElement {
    const spinnerContainerDiv = document.createElement('div');
    spinnerContainerDiv.className = styles.spinnerContainer;

    const spinnerDiv = document.createElement('div');
    spinnerDiv.className = styles.spinner;
    spinnerDiv.innerHTML = `<svg class="${styles.spinnerSlice}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21">
      <defs>
        <style>
          .slice {
            fill: none;
            stroke: currentColor;
            stroke-miterlimit:10;
            stroke-width:2px;
          }
        </style>
      </defs>
      <path class="slice" d="M17.5,6.5a10,10,0,0,1,10,10" transform="translate(-7 -6)"/>
    </svg>
    <svg class="${styles.spinnerRing}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21">
      <defs>
        <style>
          .ring {
            fill: none;
            stroke: currentColor;
            stroke-miterlimit:10;
            stroke-width:2px;
          }
        </style>
      </defs>
      <path class="ring" d="M10,0A10,10,0,1,1,0,10,10,10,0,0,1,10,0Z" transform="translate(0.5 0.5)"/>
  </svg>`;

    spinnerContainerDiv.appendChild(spinnerDiv);

    const spinnerLoadingMessageDiv = document.createElement('div');
    spinnerLoadingMessageDiv.className = styles.spinnerLoadingMessage;
    spinnerLoadingMessageDiv.innerText = titleMessage;
    spinnerContainerDiv.appendChild(spinnerLoadingMessageDiv);

    // Accessibility container
    const spinnerAccessibilityContainerDiv = document.createElement('div');
    spinnerAccessibilityContainerDiv.setAttribute('role', 'status');
    spinnerAccessibilityContainerDiv.setAttribute('aria-live', 'polite');

    const spinnerAccessibilityMessageDiv = document.createElement('div');
    spinnerAccessibilityMessageDiv.className = styles.spinnerAccessibilityMessage;
    spinnerAccessibilityMessageDiv.innerText = titleMessage;
    spinnerAccessibilityContainerDiv.appendChild(spinnerAccessibilityMessageDiv);

    spinnerContainerDiv.appendChild(spinnerAccessibilityContainerDiv);

    return spinnerContainerDiv;
  }

  /**
   * Render error message
   */
  private _renderError(
    domElement: HTMLElement,
    error: Error | string,
    options?: IRenderErrorOptions,
  ): void {
    if (!domElement || !error) {
      return;
    }

    const { message: extraMessage, clearDomElementCallback } = options || {};

    const errorText = this._formatErrorText(error, extraMessage);
    const cacheEntry = this._getCacheEntry(domElement);
    cacheEntry.isErrorBeingRendered = true;

    const errorComponent = this._createErrorComponent(errorText);

    let divErr = domElement.querySelector(`div[data-sp-id='${this._errorId}']`) as HTMLElement;

    if (divErr) {
      divErr.style.display = 'block';
    } else {
      divErr = document.createElement('div');
      divErr.setAttribute('data-sp-id', this._errorId);

      if (clearDomElementCallback) {
        clearDomElementCallback(domElement);
      }
      this._clearChildren(domElement);
      domElement.appendChild(divErr);
    }

    // Set automation id for testing
    divErr.setAttribute('data-automation-id', 'webPartError');
    divErr.innerHTML = '';
    divErr.appendChild(errorComponent);
  }

  /**
   * Format error text from Error object or string
   */
  private _formatErrorText(error: Error | string, extraMessage?: string): string {
    const newLineSeparator = '\r\n';
    const extra = extraMessage ? `${newLineSeparator}${newLineSeparator}${extraMessage}` : '';

    if (typeof error === 'string') {
      return StatusRendererStrings.WebpartErrorErrorText(newLineSeparator, error, '', extra);
    }

    const vanillaError = error as Error;
    const stack = vanillaError.stack;
    const callStack = stack
      ? StatusRendererStrings.WebpartErrorCallStackText(newLineSeparator, stack)
      : '';

    return StatusRendererStrings.WebpartErrorErrorText(
      newLineSeparator,
      vanillaError.message || String(error),
      callStack,
      extra,
    );
  }

  /**
   * Create error component based on DEBUG mode
   */
  private _createErrorComponent(errorMessage: string): HTMLElement {
    const isDebug =
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

    if (!isDebug) {
      return this._createFriendlyErrorMessage(errorMessage);
    } else {
      return this._createErrorMessage(errorMessage);
    }
  }

  /**
   * Create full error message (DEBUG mode)
   */
  private _createErrorMessage(errorMessage: string): HTMLElement {
    const container = document.createElement('div');
    container.className = styles.errorBox;
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'assertive');

    const errorText = document.createElement('span');
    errorText.className = styles.errorBoxText;
    errorText.innerText = errorMessage;
    container.appendChild(errorText);

    return container;
  }

  /**
   * Create friendly error message (production mode)
   */
  private _createFriendlyErrorMessage(errorMessage: string): HTMLElement {
    const container = document.createElement('div');
    container.className = styles.errorBox;

    // Header text
    const header = document.createElement('h2');
    header.className = styles.somethingWentWrongText;
    header.innerText = StatusRendererStrings.WebpartErrorSomethingWentWrong;
    container.appendChild(header);

    // Supporting text
    const siteAdminText = document.createElement('span');
    siteAdminText.className = styles.siteAdminText;
    siteAdminText.innerText = StatusRendererStrings.WebpartErrorSiteAdminAdvice;
    container.appendChild(siteAdminText);

    // Button to reveal more details
    const buttonContainer = document.createElement('div');
    const techDetailsButton = document.createElement('button');
    techDetailsButton.className = styles.detailsButton;
    techDetailsButton.innerText = StatusRendererStrings.WebpartErrorTechnicalDetails;

    // Full error message (initially hidden)
    const errorDetails = this._createErrorMessage(errorMessage);
    errorDetails.style.display = 'none';

    techDetailsButton.onclick = () => {
      if (errorDetails.style.display === 'none') {
        errorDetails.style.display = '';
      } else {
        errorDetails.style.display = 'none';
      }
    };

    buttonContainer.appendChild(techDetailsButton);
    container.appendChild(buttonContainer);
    container.appendChild(errorDetails);

    return container;
  }

  /**
   * Get or create cache entry for domElement
   */
  private _getCacheEntry(domElement: Element): ICacheEntry {
    if (this._activeIndicatorCache.has(domElement)) {
      return this._activeIndicatorCache.get(domElement)!;
    }

    const cacheEntry: ICacheEntry = {
      loadingTimer: undefined,
      placeholder: undefined,
      isErrorBeingRendered: false,
    };

    this._activeIndicatorCache.set(domElement, cacheEntry);
    return cacheEntry;
  }

  /**
   * Clear all children from element
   */
  private _clearChildren(element: Element): void {
    while (element.hasChildNodes()) {
      if (element.lastChild) {
        element.removeChild(element.lastChild);
      }
    }
  }
}
