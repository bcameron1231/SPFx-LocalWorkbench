// Personal Settings
//
// Per-developer values that must not live in a repository or a generated workspace: which tenant
// to sign in to, which site to use, and optionally an own Entra ID app. Read from
// ~/.spfx-local-workbench/settings.json (or the path in SPFX_LOCAL_WORKBENCH_SETTINGS).
//
// Precedence: a VS Code setting set explicitly (user, workspace or folder) wins over this file,
// which wins over the extension defaults.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

export interface IPersonalSettings {
  /** Tenant ID or domain, e.g. contoso.onmicrosoft.com */
  tenantId?: string;
  /** Optional own Entra ID app (client) ID, needed for Microsoft Graph sources */
  clientId?: string;
  /** Site the workbench page context points at, e.g. https://contoso.sharepoint.com/sites/dev */
  siteUrl?: string;
  /** Allow requests that change tenant data (default false) */
  allowWrites?: boolean;
  /** HTTPS origins of APIs that may receive the Graph token (default none) */
  graphTokenHosts?: string[];
}

export const PERSONAL_SETTINGS_TEMPLATE: IPersonalSettings = {
  tenantId: '<your-tenant>.onmicrosoft.com',
  siteUrl: 'https://<your-tenant>.sharepoint.com/sites/<your-site>',
  clientId: '',
  allowWrites: false,
  graphTokenHosts: [],
};

let cache: { file: string; mtimeMs: number; value: IPersonalSettings } | undefined;

export function getPersonalSettingsPath(): string {
  return (
    process.env.SPFX_LOCAL_WORKBENCH_SETTINGS ||
    path.join(os.homedir(), '.spfx-local-workbench', 'settings.json')
  );
}

/** Reads the personal settings file; returns {} when it is missing or invalid */
export function readPersonalSettings(): IPersonalSettings {
  const file = getPersonalSettingsPath();
  let mtimeMs: number;
  try {
    mtimeMs = fs.statSync(file).mtimeMs;
  } catch {
    cache = undefined;
    return {};
  }
  if (cache && cache.file === file && cache.mtimeMs === mtimeMs) {
    return cache.value;
  }

  let value: IPersonalSettings = {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as IPersonalSettings;
    value = {
      tenantId: nonEmpty(parsed.tenantId),
      clientId: nonEmpty(parsed.clientId),
      siteUrl: nonEmpty(parsed.siteUrl),
      allowWrites: parsed.allowWrites === true ? true : undefined,
      graphTokenHosts: Array.isArray(parsed.graphTokenHosts) ? parsed.graphTokenHosts : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showWarningMessage(`SPFx Local Workbench: ignoring ${file}: ${message}`);
  }
  cache = { file, mtimeMs, value };
  return value;
}

/**
 * The value of a setting only when someone set it explicitly (not the package.json default).
 * userOnly ignores workspace and folder values: a repository must not be able to set them (tenant
 * sign-in, writes, hosts that receive a token).
 */
export function explicitSetting<T>(section: string, key: string, userOnly = false): T | undefined {
  const inspected = vscode.workspace.getConfiguration(section).inspect<T>(key);
  if (userOnly) {
    return inspected?.globalValue;
  }
  return inspected?.workspaceFolderValue ?? inspected?.workspaceValue ?? inspected?.globalValue;
}

/** Creates the personal settings file from the template (if missing) and opens it */
export async function openPersonalSettings(): Promise<void> {
  const file = getPersonalSettingsPath();
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(PERSONAL_SETTINGS_TEMPLATE, null, 2)}\n`, 'utf-8');
  }
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
  await vscode.window.showTextDocument(document);
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() && !value.includes('<your-')
    ? value.trim()
    : undefined;
}
