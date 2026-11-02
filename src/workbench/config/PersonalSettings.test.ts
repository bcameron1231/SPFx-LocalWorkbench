import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PERSONAL_SETTINGS_TEMPLATE,
  explicitSetting,
  getPersonalSettingsPath,
  readPersonalSettings,
} from './PersonalSettings';

const inspect = vi.fn();
vi.mock('vscode', () => ({
  window: { showWarningMessage: vi.fn() },
  workspace: { getConfiguration: () => ({ inspect }) },
}));

let folder: string;
let file: string;

beforeEach(() => {
  folder = fs.mkdtempSync(path.join(os.tmpdir(), 'spfx-personal-settings-'));
  file = path.join(folder, 'settings.json');
  process.env.SPFX_LOCAL_WORKBENCH_SETTINGS = file;
});

afterEach(() => {
  delete process.env.SPFX_LOCAL_WORKBENCH_SETTINGS;
  fs.rmSync(folder, { recursive: true, force: true });
  inspect.mockReset();
});

describe('readPersonalSettings', () => {
  it('uses the path from SPFX_LOCAL_WORKBENCH_SETTINGS', () => {
    expect(getPersonalSettingsPath()).toBe(file);
  });

  it('returns an empty object when the file is missing', () => {
    expect(readPersonalSettings()).toEqual({});
  });

  it('reads and trims the values', () => {
    fs.writeFileSync(
      file,
      JSON.stringify({
        tenantId: ' contoso.onmicrosoft.com ',
        siteUrl: 'https://contoso.sharepoint.com/sites/dev',
        clientId: '',
        allowWrites: true,
        graphTokenHosts: ['https://api.example.com'],
      }),
    );
    expect(readPersonalSettings()).toEqual({
      tenantId: 'contoso.onmicrosoft.com',
      siteUrl: 'https://contoso.sharepoint.com/sites/dev',
      clientId: undefined,
      allowWrites: true,
      graphTokenHosts: ['https://api.example.com'],
    });
  });

  it('ignores the untouched template placeholders', () => {
    fs.writeFileSync(file, JSON.stringify(PERSONAL_SETTINGS_TEMPLATE));
    const settings = readPersonalSettings();
    expect(settings.tenantId).toBeUndefined();
    expect(settings.siteUrl).toBeUndefined();
    expect(settings.allowWrites).toBeUndefined();
  });

  it('only turns writes on for the boolean true', () => {
    fs.writeFileSync(
      file,
      JSON.stringify({ tenantId: 'contoso.onmicrosoft.com', allowWrites: 'true' }),
    );
    expect(readPersonalSettings().allowWrites).toBeUndefined();
  });

  it('returns an empty value for invalid JSON', () => {
    fs.writeFileSync(file, '{ not json');
    expect(readPersonalSettings().tenantId).toBeUndefined();
  });
});

describe('explicitSetting', () => {
  const values = {
    globalValue: 'user',
    workspaceValue: 'workspace',
    workspaceFolderValue: 'folder',
  };

  it('prefers folder, then workspace, then user values', () => {
    inspect.mockReturnValue(values);
    expect(explicitSetting('section', 'key')).toBe('folder');
    inspect.mockReturnValue({ globalValue: 'user', workspaceValue: 'workspace' });
    expect(explicitSetting('section', 'key')).toBe('workspace');
    inspect.mockReturnValue({ globalValue: 'user' });
    expect(explicitSetting('section', 'key')).toBe('user');
  });

  it('ignores the package.json default', () => {
    inspect.mockReturnValue({ defaultValue: 'default' });
    expect(explicitSetting('section', 'key')).toBeUndefined();
  });

  it('with userOnly, never returns a workspace or folder value', () => {
    inspect.mockReturnValue(values);
    expect(explicitSetting('section', 'key', true)).toBe('user');
    inspect.mockReturnValue({ workspaceValue: 'workspace', workspaceFolderValue: 'folder' });
    expect(explicitSetting('section', 'key', true)).toBeUndefined();
  });
});
