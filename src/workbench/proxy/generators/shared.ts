// Shared constants and helpers for mock data generators.

import * as vscode from 'vscode';
import type { ApiClientType } from '../types';

// ── Default response bodies for common status codes ────────────────

export function defaultBodyForStatus(status: number): unknown {
    switch (status) {
        case 200: return { value: [] };
        case 201: return { message: 'Created' };
        case 204: return undefined; // No Content
        case 400: return { error: { code: 'BadRequest', message: 'Bad request' } };
        case 401: return { error: { code: 'Unauthorized', message: 'Access denied. Bearer token is missing or invalid.' } };
        case 403: return { error: { code: 'Forbidden', message: 'Insufficient privileges to complete the operation.' } };
        case 404: return { error: { code: 'NotFound', message: 'The requested resource was not found.' } };
        case 429: return { error: { code: 'TooManyRequests', message: 'Too many requests. Please retry after a delay.' } };
        case 500: return { error: { code: 'InternalServerError', message: 'An internal server error occurred.' } };
        case 503: return { error: { code: 'ServiceUnavailable', message: 'The service is temporarily unavailable.' } };
        default: return {};
    }
}

// ── Status Code Quick Picks ────────────────────────────────────────

export interface StatusCodeOption {
    label: string;
    status: number;
    description: string;
}

export const STATUS_CODE_OPTIONS: StatusCodeOption[] = [
    { label: '200 OK', status: 200, description: 'Successful response' },
    { label: '201 Created', status: 201, description: 'Resource created' },
    { label: '204 No Content', status: 204, description: 'Success with no body' },
    { label: '400 Bad Request', status: 400, description: 'Client error' },
    { label: '401 Unauthorized', status: 401, description: 'Authentication required' },
    { label: '403 Forbidden', status: 403, description: 'Insufficient permissions' },
    { label: '404 Not Found', status: 404, description: 'Resource not found' },
    { label: '429 Too Many Requests', status: 429, description: 'Rate limited' },
    { label: '500 Internal Server Error', status: 500, description: 'Server error' },
    { label: '503 Service Unavailable', status: 503, description: 'Service down' },
];

export const METHOD_OPTIONS = ['ANY', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export const CLIENT_TYPE_OPTIONS: { label: string; value: ApiClientType | undefined }[] = [
    { label: 'Any (all client types)', value: undefined },
    { label: 'spHttp — SPHttpClient', value: 'spHttp' },
    { label: 'http — HttpClient', value: 'http' },
    { label: 'aadHttp — AadHttpClient', value: 'aadHttp' },
    { label: 'fetch — Global fetch()', value: 'fetch' },
];

// ── Shared Prompt Helper ───────────────────────────────────────────

/**
 * Prompts the user for URL, HTTP method, client type, and status code.
 */
export async function promptRuleOptions(titlePrefix: string): Promise<{
    url: string;
    method: string | undefined;
    clientType: ApiClientType | undefined;
    status: number;
} | undefined> {
    const url = await vscode.window.showInputBox({
        title: `${titlePrefix} — URL Pattern`,
        prompt: 'Enter the URL or URL pattern this rule should match',
        placeHolder: '/api/data  or  /_api/web/lists',
        ignoreFocusOut: true,
    });
    if (!url) { return undefined; }

    const methodPick = await vscode.window.showQuickPick(
        METHOD_OPTIONS.map(m => ({ label: m })),
        { title: `${titlePrefix} — HTTP Method`, placeHolder: 'Select HTTP method', ignoreFocusOut: true }
    );
    if (!methodPick) { return undefined; }

    const clientTypePick = await vscode.window.showQuickPick(
        CLIENT_TYPE_OPTIONS.map(c => ({ label: c.label, value: c.value })),
        { title: `${titlePrefix} — Client Type`, placeHolder: 'Select client type', ignoreFocusOut: true }
    );
    if (!clientTypePick) { return undefined; }

    const statusPick = await vscode.window.showQuickPick(
        STATUS_CODE_OPTIONS.map(s => ({ label: s.label, description: s.description, status: s.status })),
        { title: `${titlePrefix} — Status Code`, placeHolder: 'Select response status code', ignoreFocusOut: true }
    );
    if (!statusPick) { return undefined; }

    return {
        url,
        method: methodPick.label === 'ANY' ? undefined : methodPick.label,
        clientType: (clientTypePick as { label: string; value: ApiClientType | undefined }).value,
        status: statusPick.status,
    };
}
