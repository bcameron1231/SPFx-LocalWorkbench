import { afterEach, describe, expect, it, vi } from 'vitest';

import { MockRuleEngine } from '@spfx-local-workbench/shared';

import type { IMockRule, IProxyRequest } from './types';

const request: IProxyRequest = {
  id: 'request',
  url: 'https://contoso.sharepoint.com/_api/web',
  method: 'GET',
  headers: {},
  clientType: 'spHttp',
};

function rule(delay?: number): IMockRule {
  return {
    match: { url: '/_api/web' },
    response: {
      status: 200,
      ...(delay === undefined ? {} : { delay }),
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('MockRuleEngine delay precedence', () => {
  it.each([
    {
      label: 'per-rule over file and setting',
      ruleDelay: 10,
      fileDelay: 30,
      settingDelay: 50,
      expected: 10,
    },
    {
      label: 'file over setting',
      ruleDelay: undefined,
      fileDelay: 30,
      settingDelay: 50,
      expected: 30,
    },
    {
      label: 'setting when the file omits delay',
      ruleDelay: undefined,
      fileDelay: undefined,
      settingDelay: 50,
      expected: 50,
    },
  ])('uses $label', async ({ ruleDelay, fileDelay, settingDelay, expected }) => {
    vi.useFakeTimers();
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const engine = new MockRuleEngine();
    engine.setConfig(
      {
        ...(fileDelay === undefined ? {} : { delay: fileDelay }),
        rules: [rule(ruleDelay)],
      },
      settingDelay,
    );

    const responsePromise = engine.processRequest(request);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), expected);
    await vi.runAllTimersAsync();
    await expect(responsePromise).resolves.toMatchObject({ status: 200, matched: true });
  });

  it('uses zero when every delay source is absent', async () => {
    vi.useFakeTimers();
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const engine = new MockRuleEngine();
    engine.setConfig({ rules: [rule()] });

    await expect(engine.processRequest(request)).resolves.toMatchObject({
      status: 200,
      matched: true,
    });
    expect(timeoutSpy).not.toHaveBeenCalled();
  });
});
