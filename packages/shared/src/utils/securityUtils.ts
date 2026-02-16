import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure nonce for CSP headers
 * @returns A base64url-encoded random string
 */
export function getNonce(): string {
    return randomBytes(16).toString('base64url');
}
