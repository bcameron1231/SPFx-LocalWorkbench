/**
 * Timing constants for delays and timeouts throughout the application
 */

// Component rendering delays (in milliseconds)
/** Delay to allow DOM elements to render before component initialization */
export const DOM_RENDER_DELAY_MS = 100;

/** Delay after component removal to allow cleanup */
export const COMPONENT_REMOVAL_DELAY_MS = 50;

/** Delay after AMD module registration */
export const AMD_REGISTRATION_DELAY_MS = 100;

// Event delays (in milliseconds)
/** Delay before firing changedEvent to allow handlers to register */
export const CHANGED_EVENT_DELAY_MS = 50;

/** Delay before checking if extension rendered placeholder content */
export const CONTENT_CHECK_DELAY_MS = 500;

// Debounce delays (in milliseconds)
/** Delay before re-measuring web part widths after a layout change, so the new layout has been applied */
export const CANVAS_RESIZE_CHECK_DELAY_MS = 150;

/** Debounce delay before saving the canvas state (web parts, properties and layout) */
export const CANVAS_STATE_SAVE_DEBOUNCE_MS = 300;

/** Debounce delay for live reload when multiple files change */
export const LIVE_RELOAD_DEBOUNCE_MS = 500;

// Process timeouts (in milliseconds)
/** Timeout before force-killing a process with SIGKILL */
export const PROCESS_FORCE_KILL_TIMEOUT_MS = 5000;

/** Default timeout for Storybook server startup */
export const STORYBOOK_STARTUP_TIMEOUT_MS = 60000;

// Network timeouts (in milliseconds)
/** Default timeout for port reachability checks */
export const PORT_CHECK_TIMEOUT_MS = 1000;
