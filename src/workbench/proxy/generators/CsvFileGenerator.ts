// CSV File Generator
//
// Imports a CSV file, parses it into JSON rows, and generates a mock rule.

import * as vscode from 'vscode';
import type { IMockRule } from '../types';
import { parseCsv } from './CsvParser';
import type { CsvParseWarning } from './CsvParser';
import { promptRuleOptions } from './shared';

/**
 * Prompts the user to select a CSV file and generates a mock rule from its rows.
 * Returns the generated rule, or `undefined` if the user cancelled.
 */
export async function importCsvFile(): Promise<IMockRule[] | undefined> {
    // Pick file
    const fileUris = await vscode.window.showOpenDialog({
        title: 'Import CSV File as Mock Response Body',
        canSelectMany: false,
        filters: { 'CSV Files': ['csv'] },
    });
    if (!fileUris || fileUris.length === 0) { return undefined; }

    const fileUri = fileUris[0];
    const raw = await vscode.workspace.fs.readFile(fileUri);
    const text = Buffer.from(raw).toString('utf-8');
    const result = parseCsv(text);


    if (!result.ok) {
        vscode.window.showErrorMessage(`CSV parse error: ${result.error}`);
        return undefined;
    }

    const { rows, warnings } = result;

    if (rows.length === 0) {
        vscode.window.showErrorMessage('The CSV file is empty or has no data rows.');
        return undefined;
    }

    // Show warnings if any
    if (warnings.length > 0) {
        const showWarnings = await showCsvWarnings(warnings, rows.length);
        if (!showWarnings) { return undefined; }
    }

    // Show preview
    const previewLines = rows.slice(0, 3).map(r => JSON.stringify(r)).join('\n');
    const totalLabel = rows.length > 3 ? `\n... and ${rows.length - 3} more rows` : '';

    const proceed = await vscode.window.showInformationMessage(
        `Parsed ${rows.length} row(s) from CSV.\n\nPreview:\n${previewLines}${totalLabel}`,
        { modal: true },
        'Continue'
    );
    if (proceed !== 'Continue') { return undefined; }

    // Wrap format choice
    const wrapChoice = await vscode.window.showQuickPick(
        [
            { label: 'Array', description: 'Wrap rows in a plain JSON array: [...]' },
            { label: 'SharePoint REST', description: 'Wrap in { d: { results: [...] } }' },
            { label: 'Graph / OData', description: 'Wrap in { value: [...] }' },
        ],
        { title: 'Response body format', ignoreFocusOut: true }
    );
    if (!wrapChoice) { return undefined; }

    let body: unknown;
    switch (wrapChoice.label) {
        case 'SharePoint REST':
            body = { d: { results: rows } };
            break;
        case 'Graph / OData':
            body = { value: rows };
            break;
        default:
            body = rows;
            break;
    }

    // Ask for URL, method, clientType, status
    const ruleOptions = await promptRuleOptions('Import CSV');
    if (!ruleOptions) { return undefined; }

    const rule: IMockRule = {
        match: {
            url: ruleOptions.url,
            ...(ruleOptions.method ? { method: ruleOptions.method } : {}),
            ...(ruleOptions.clientType ? { clientType: ruleOptions.clientType } : {}),
        },
        response: {
            status: ruleOptions.status,
            headers: { 'content-type': 'application/json' },
            body,
        },
    };

    return [rule];
}

// Shows parse warnings and asks whether to proceed.
async function showCsvWarnings(warnings: CsvParseWarning[], rowCount: number): Promise<boolean> {
    const summary = warnings.length === 1
        ? '1 warning while parsing CSV'
        : `${warnings.length} warnings while parsing CSV`;

    const detail = warnings
        .slice(0, 10)
        .map(w => `  Row ${w.row}: ${w.message}`)
        .join('\n');

    const extra = warnings.length > 10
        ? `\n  ... and ${warnings.length - 10} more warning(s)`
        : '';

    const choice = await vscode.window.showWarningMessage(
        `${summary} (${rowCount} row(s) parsed).\n\n${detail}${extra}`,
        { modal: true },
        'Continue Anyway',
    );

    return choice === 'Continue Anyway';
}