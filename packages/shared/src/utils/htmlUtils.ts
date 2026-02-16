/**
 * Escapes HTML special characters to prevent XSS
 * @param unsafe String that may contain HTML special characters
 * @returns Escaped string safe for HTML insertion
 */
export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
