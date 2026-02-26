// CSV File Generator
//
// Imports a CSV file, parses it into JSON rows, and generates a mock rule.

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import type { IMockRule } from '../types';
import { parseCsv } from './CsvParser';
import { promptRuleOptions } from './shared';

/**
 * Prompts the user to select a CSV file and generates a mock rule from its rows.
 * Returns the generated rule, or `undefined` if the user cancelled.
 */
export async function importCsvFile(): Promise<IMockRule[] | undefined> {
    nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone });
    const localize = nls.loadMessageBundle();
    // Pick file
    const fileUris = await vscode.window.showOpenDialog({
        title: localize('importCsv.title', 'Import CSV File as Mock Response Body'),
        canSelectMany: false,
        filters: { 'CSV Files': ['csv'] },
    });
    if (!fileUris || fileUris.length === 0) { return undefined; }

    const fileUri = fileUris[0];
    const raw = await vscode.workspace.fs.readFile(fileUri);
    const text = Buffer.from(raw).toString('utf-8');
    const rows = parseCsv(text);

    if (rows.length === 0) {
        vscode.window.showErrorMessage(localize('importCsv.empty', 'The CSV file is empty or has no data rows.'));
        return undefined;
    }

    // Show preview
    const previewLines = rows.slice(0, 3).map(r => JSON.stringify(r)).join('\n');
    const totalLabel = rows.length > 3 ? `\n... and ${rows.length - 3} more rows` : '';

    const proceed = await vscode.window.showInformationMessage(
        localize('importCsv.previewMessage', "Parsed {0} row(s) from CSV.\n\nPreview:\n{1}{2}", rows.length, previewLines, totalLabel),
        { modal: true },
        localize('importCsv.continue', 'Continue')
    );
    if (proceed !== localize('importCsv.continue', 'Continue')) { return undefined; }

    // Wrap format choice
    const wrapChoice = await vscode.window.showQuickPick(
        [
            { label: localize('importCsv.wrap.array', 'Array'), description: localize('importCsv.wrap.arrayDesc', 'Wrap rows in a plain JSON array: [...]') },
            { label: localize('importCsv.wrap.sprest', 'SharePoint REST'), description: localize('importCsv.wrap.sprestDesc', 'Wrap in { d: { results: [...] } }') },
            { label: localize('importCsv.wrap.graph', 'Graph / OData'), description: localize('importCsv.wrap.graphDesc', 'Wrap in { value: [...] }') },
        ],
        { title: localize('importCsv.formatTitle', 'Response body format'), ignoreFocusOut: true }
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
    const ruleOptions = await promptRuleOptions(localize('importCsv.promptTitle', 'Import CSV'));
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
