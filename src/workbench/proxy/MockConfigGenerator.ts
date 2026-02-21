// Mock Config Generator
//
// Orchestrates the different mock data generators and manages the config file.
// Individual generators live in the ./generators/ folder:
//   - StatusStubGenerator   — wizard-driven status-code stubs
//   - JsonFileGenerator     — import a JSON file as response body
//   - CsvFileGenerator      — parse CSV rows into a JSON array response body
//   - RecordedRequestGenerator — generate rules from recorded unmatched requests

import * as vscode from 'vscode';
import * as path from 'path';
import type { IMockConfig, IMockRule } from './types';
import {
    generateStatusStubs,
    importJsonFile,
    importCsvFile,
    generateFromRecordedRequests,
} from './generators';
import type { IRecordedRequest } from './generators';

// Re-export IRecordedRequest so existing consumers keep working.
export type { IRecordedRequest } from './generators';

// ── Main Generator Class ───────────────────────────────────────────

export class MockConfigGenerator {
    private readonly _workspaceRoot: string;
    private readonly _mockFilePath: string;

    constructor(workspaceRoot: string, mockFileRelative?: string) {
        this._workspaceRoot = workspaceRoot;
        this._mockFilePath = path.join(
            workspaceRoot,
            mockFileRelative ?? '.spfx-workbench/api-mocks.json'
        );
    }

    // ── 1. Quick Status-Code Stubs ──────────────────────────────────

    async generateStatusStubs(): Promise<boolean> {
        const rules = await generateStatusStubs();
        if (!rules) { return false; }
        await this._mergeRules(rules);
        return true;
    }

    // ── 2. Import JSON File ─────────────────────────────────────────

    async importJsonFile(): Promise<boolean> {
        const rules = await importJsonFile(this._workspaceRoot);
        if (!rules) { return false; }
        await this._mergeRules(rules);
        return true;
    }

    // ── 3. Import CSV File ──────────────────────────────────────────

    async importCsvFile(): Promise<boolean> {
        const rules = await importCsvFile();
        if (!rules) { return false; }
        await this._mergeRules(rules);
        return true;
    }

    // ── 4. Generate Rules from Recorded Requests ────────────────────

    async generateFromRecordedRequests(requests: IRecordedRequest[]): Promise<boolean> {
        const rules = await generateFromRecordedRequests(requests);
        if (!rules) { return false; }
        await this._mergeRules(rules);
        return true;
    }

    // ── Merge Helper ────────────────────────────────────────────────

    // Merge new rules into the existing config file (or create it).
    private async _mergeRules(newRules: IMockRule[]): Promise<void> {
        let config: IMockConfig;

        try {
            const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(this._mockFilePath));
            const text = Buffer.from(raw).toString('utf-8');
            config = JSON.parse(text) as IMockConfig;
            if (!Array.isArray(config.rules)) {
                config.rules = [];
            }
        } catch {
            // File doesn't exist — start fresh
            config = { rules: [] };
        }

        config.rules.push(...newRules);

        // Ensure directory exists
        const configDir = path.dirname(this._mockFilePath);
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(configDir));

        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(this._mockFilePath),
            Buffer.from(JSON.stringify(config, null, 2), 'utf-8')
        );

        // Open the file for the user to review
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(this._mockFilePath));
        await vscode.window.showTextDocument(doc);
    }
}
