// Status Stub Generator
//
// Wizard-driven generator that creates mock rules for common HTTP status codes.

import * as vscode from 'vscode';
import type { IMockRule, ApiClientType } from '../types';
import {
    defaultBodyForStatus,
    STATUS_CODE_OPTIONS,
    METHOD_OPTIONS,
    CLIENT_TYPE_OPTIONS,
} from './shared';

/**
 * Walks the user through a wizard to generate mock rules for selected status codes.
 * Returns the generated rules, or `undefined` if the user cancelled.
 */
export async function generateStatusStubs(): Promise<IMockRule[] | undefined> {
    // Step 1: URL pattern
    const url = await vscode.window.showInputBox({
        title: 'Mock Rule Generator (1/4)',
        prompt: 'Enter a URL or URL pattern to mock',
        placeHolder: '/api/orders  or  /_api/web/lists',
        ignoreFocusOut: true,
    });
    if (!url) { return undefined; }

    // Step 2: HTTP method
    const methodPick = await vscode.window.showQuickPick(
        METHOD_OPTIONS.map(m => ({ label: m })),
        { title: 'Mock Rule Generator (2/4)', placeHolder: 'Select HTTP method', ignoreFocusOut: true }
    );
    if (!methodPick) { return undefined; }

    // Step 3: Client type
    const clientTypePick = await vscode.window.showQuickPick(
        CLIENT_TYPE_OPTIONS.map(c => ({ label: c.label, value: c.value })),
        { title: 'Mock Rule Generator (3/4)', placeHolder: 'Select client type', ignoreFocusOut: true }
    );
    if (!clientTypePick) { return undefined; }

    // Step 4: Status codes (multi-select)
    const statusPicks = await vscode.window.showQuickPick(
        STATUS_CODE_OPTIONS.map(s => ({ label: s.label, description: s.description, status: s.status, picked: s.status === 200 })),
        { title: 'Mock Rule Generator (4/4)', placeHolder: 'Select status codes to generate', canPickMany: true, ignoreFocusOut: true }
    );
    if (!statusPicks || statusPicks.length === 0) { return undefined; }

    // Build rules
    const method = methodPick.label === 'ANY' ? undefined : methodPick.label;
    const clientType = (clientTypePick as { label: string; value: ApiClientType | undefined }).value;
    const rules: IMockRule[] = [];

    // First selected status is enabled, the rest are disabled
    for (let i = 0; i < statusPicks.length; i++) {
        const status = statusPicks[i].status;
        const body = defaultBodyForStatus(status);
        const rule: IMockRule = {
            match: {
                url,
                ...(method ? { method } : {}),
                ...(clientType ? { clientType } : {}),
            },
            response: {
                status,
                headers: { 'content-type': 'application/json' },
                ...(body !== undefined ? { body } : {}),
            },
            ...(i > 0 ? { disabled: true } : {}),
        };
        rules.push(rule);
    }

    return rules;
}
