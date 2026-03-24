// Recorded Request Generator
//
// Generates mock rules from previously recorded unmatched API requests.
import * as vscode from 'vscode';

import { localize } from '@spfx-local-workbench/shared/utilities/localize';

import type { IMockRule } from '../types';
import { STATUS_CODE_OPTIONS, defaultBodyForStatus } from './shared';
import type { IRecordedRequest } from './types';

/**
 * Presents the user with recorded unmatched requests and generates stub rules.
 * Returns the generated rules, or `undefined` if the user cancelled.
 */
export async function generateFromRecordedRequests(
  requests: IRecordedRequest[],
): Promise<IMockRule[] | undefined> {
  if (requests.length === 0) {
    vscode.window.showInformationMessage(
      localize(
        'record.noRecordedRequests',
        'No unmatched requests have been recorded yet. Run your web part first, then try again.',
      ),
    );
    return undefined;
  }

  // Deduplicate by url + method + clientType
  const seen = new Set<string>();
  const unique: IRecordedRequest[] = [];
  for (const req of requests) {
    const key = `${req.method}|${req.url}|${req.clientType}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(req);
    }
  }

  // Let user pick which ones to generate rules for
  const picks = await vscode.window.showQuickPick(
    unique.map((r) => ({
      label: `${r.method} ${r.url}`,
      description: `[${r.clientType}]`,
      picked: true,
      request: r,
    })),
    {
      title: localize(
        'record.pickTitle',
        'Generate rules from {0} recorded request(s)',
        unique.length,
      ),
      canPickMany: true,
      ignoreFocusOut: true,
    },
  );

  if (!picks || picks.length === 0) {
    return undefined;
  }

  // Pick default status for all generated rules
  const statusPick = await vscode.window.showQuickPick(
    STATUS_CODE_OPTIONS.map((s) => ({
      label: s.label,
      description: s.description,
      status: s.status,
    })),
    {
      title: localize('record.statusTitle', 'Default status code for generated rules'),
      ignoreFocusOut: true,
    },
  );
  if (!statusPick) {
    return undefined;
  }

  const rules: IMockRule[] = picks.map((p) => ({
    match: {
      url: p.request.url,
      method: p.request.method,
      clientType: p.request.clientType,
    },
    response: {
      status: statusPick.status,
      headers: { 'content-type': 'application/json' },
      body: defaultBodyForStatus(statusPick.status),
    },
  }));

  return rules;
}
