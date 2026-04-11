// JSON File Generator
//
// Imports a JSON file as the response body for a mock rule.
// Supports either inlining the body or referencing the file via bodyFile.
import * as path from 'path';
import * as vscode from 'vscode';

import { localize } from '@spfx-local-workbench/shared/utils/node';

import type { IMockRule } from '../types';
import { promptRuleOptions } from './shared';

/**
 * Prompts the user to select a JSON file and generates a mock rule using it.
 * Returns the generated rule, or `undefined` if the user cancelled.
 *
 * @param workspaceRoot  Absolute path to the workspace root (used for relative bodyFile paths).
 */
export async function importJsonFile(workspaceRoot: string): Promise<IMockRule[] | undefined> {
  // Pick file
  const fileUris = await vscode.window.showOpenDialog({
    title: localize('importJson.title', 'Import JSON File as Mock Response Body'),
    canSelectMany: false,
    filters: { 'JSON Files': ['json'] },
  });
  if (!fileUris || fileUris.length === 0) {
    return undefined;
  }

  const fileUri = fileUris[0];
  const raw = await vscode.workspace.fs.readFile(fileUri);
  const text = Buffer.from(raw).toString('utf-8');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    vscode.window.showErrorMessage(
      localize('importJson.invalidJson', 'The selected file is not valid JSON.'),
    );
    return undefined;
  }

  // Ask user for URL, method, clientType
  const ruleOptions = await promptRuleOptions(localize('importJson.promptTitle', 'Import JSON'));
  if (!ruleOptions) {
    return undefined;
  }

  // Ask: inline body or reference as bodyFile?
  const storageChoice = await vscode.window.showQuickPick(
    [
      {
        label: localize('importJson.inlineLabel', 'Inline body'),
        description: localize('importJson.inlineDesc', 'Embed the JSON directly in the mock rule'),
      },
      {
        label: localize('importJson.referenceLabel', 'Reference file'),
        description: localize(
          'importJson.referenceDesc',
          'Point the rule to this file via bodyFile path',
        ),
      },
    ],
    {
      title: localize('importJson.storageTitle', 'How should the response body be stored?'),
      ignoreFocusOut: true,
    },
  );
  if (!storageChoice) {
    return undefined;
  }

  const rule: IMockRule = {
    match: {
      url: ruleOptions.url,
      ...(ruleOptions.method ? { method: ruleOptions.method } : {}),
      ...(ruleOptions.clientType ? { clientType: ruleOptions.clientType } : {}),
    },
    response: {
      status: ruleOptions.status,
      headers: { 'content-type': 'application/json' },
    },
  };

  if (storageChoice.label === 'Reference file') {
    // Compute relative path from workspace root
    rule.response.bodyFile = path.relative(workspaceRoot, fileUri.fsPath).replace(/\\/g, '/');
  } else {
    rule.response.body = parsed;
  }

  return [rule];
}
