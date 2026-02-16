/**
 * Utilities for consistent error handling across the application
 */

/**
 * Type guard to safely check if a value is an Error instance
 * @param error - The value to check
 * @returns true if the value is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extracts an error message from an unknown error value
 * @param error - The error to extract a message from (can be any type)
 * @param fallbackMessage - Message to use if error message cannot be extracted
 * @returns A string error message
 */
export function getErrorMessage(
  error: unknown,
  fallbackMessage: string = 'An unknown error occurred',
): string {
  if (isError(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallbackMessage;
}

/**
 * Type guard to check if an error is a Node.js ENOENT (file not found) error
 * @param error - The error to check
 * @returns true if the error is an ENOENT error
 */
export function isFileNotFoundError(error: unknown): boolean {
  return error !== null && typeof error === 'object' && 'code' in error && error.code === 'ENOENT';
}

/**
 * Formats an error for logging with optional context
 * @param error - The error to format
 * @param context - Optional context string to prefix the error message
 * @returns Formatted error string
 */
export function formatError(error: unknown, context?: string): string {
  const message = getErrorMessage(error);
  return context ? `${context}: ${message}` : message;
}
