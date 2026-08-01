import { describe, expect, it } from 'vitest';

import {
  MockConfigValidationError,
  composeMockRules,
  getAllConfiguredMockRules,
  getProxyScenarioSummaries,
  validateMockConfig,
} from '../../../packages/shared/src/proxy/scenarios';
import type {
  IMockConfig,
  IMockRule,
} from '../../../packages/shared/src/proxy/types';

function rule(
  name: string | undefined,
  url: string,
  clientType?: 'spHttp' | 'http' | 'aadHttp' | 'fetch',
): IMockRule {
  return {
    ...(name ? { name } : {}),
    match: { url, ...(clientType ? { clientType } : {}) },
    response: { status: 200, body: { value: [] } },
  };
}

describe('validateMockConfig', () => {
  it('accepts base-only and additive scenario configurations', () => {
    expect(validateMockConfig({ rules: [] })).toEqual({ rules: [] });
    expect(
      validateMockConfig({
        delay: 50,
        rules: [rule('Base', '/base')],
        scenarios: [
          {
            name: 'Populated',
            description: 'Representative data',
            rules: [rule('Base', '/base'), rule(undefined, '/extra')],
          },
        ],
      }),
    ).toMatchObject({ delay: 50, scenarios: [{ name: 'Populated' }] });
  });

  it.each([
    [
      { rules: [rule('Duplicate', '/one'), rule('Duplicate', '/two')] },
      'duplicate rule name "Duplicate"',
    ],
    [
      {
        rules: [],
        scenarios: [
          { name: 'Same', rules: [] },
          { name: 'Same', rules: [] },
        ],
      },
      'duplicate scenario name "Same"',
    ],
    [
      { rules: [], scenarios: [{ name: 'Base rules', rules: [] }] },
      'name "Base rules" is reserved',
    ],
    [
      {
        rules: [],
        scenarios: [
          {
            name: 'Broken',
            rules: [rule('Duplicate', '/one'), rule('Duplicate', '/two')],
          },
        ],
      },
      'duplicate rule name "Duplicate"',
    ],
  ])('rejects invalid identities', (config, expectedMessage) => {
    expect(() => validateMockConfig(config)).toThrow(MockConfigValidationError);
    expect(() => validateMockConfig(config)).toThrow(expectedMessage);
  });
});

describe('composeMockRules', () => {
  const config: IMockConfig = {
    rules: [
      rule('First', '/first', 'spHttp'),
      rule('Replace me', '/base', 'http'),
      rule(undefined, '/unnamed'),
    ],
    scenarios: [
      {
        name: 'Alternate',
        rules: [
          rule('Replace me', '/override', 'aadHttp'),
          rule('Added', '/added', 'fetch'),
          rule(undefined, '/scenario-unnamed'),
        ],
      },
      {
        name: 'alternate',
        rules: [rule('Different case', '/case')],
      },
    ],
  };

  it('replaces complete named rules in place and appends additions', () => {
    const result = composeMockRules(config, 'Alternate');

    expect(result.rules.map((candidate) => candidate.match.url)).toEqual([
      '/first',
      '/override',
      '/unnamed',
      '/added',
      '/scenario-unnamed',
    ]);
    expect(result.overriddenRuleCount).toBe(1);
    expect(result.addedRuleCount).toBe(2);
    expect(result.scenario?.name).toBe('Alternate');
  });

  it('uses exact case-sensitive scenario identity and falls back to Base', () => {
    expect(composeMockRules(config, 'alternate').scenario?.name).toBe('alternate');

    const missing = composeMockRules(config, 'ALTERNATE');
    expect(missing.scenario).toBeUndefined();
    expect(missing.requestedScenarioFound).toBe(false);
    expect(missing.rules).toEqual(config.rules);
  });
});

describe('getProxyScenarioSummaries', () => {
  it('reports effective, added, overridden, disabled, and client-type counts', () => {
    const disabled = { ...rule('Disabled', '/disabled'), disabled: true };
    const config: IMockConfig = {
      rules: [
        rule('Shared', '/base', 'spHttp'),
        rule(undefined, '/any'),
        disabled,
      ],
      scenarios: [
        {
          name: 'Errors',
          rules: [
            { ...rule('Shared', '/error', 'aadHttp'), response: { status: 500 } },
            rule('Fetch only', '/fetch', 'fetch'),
          ],
        },
      ],
    };

    const [base, errors] = getProxyScenarioSummaries(config);
    expect(base).toMatchObject({
      isBase: true,
      enabledRuleCount: 2,
      disabledRuleCount: 1,
      addedRuleCount: 0,
      overriddenRuleCount: 0,
      ruleTypeCounts: { any: 1, spHttp: 1, http: 0, aadHttp: 0, fetch: 0 },
    });
    expect(errors).toMatchObject({
      scenarioName: 'Errors',
      enabledRuleCount: 3,
      disabledRuleCount: 1,
      addedRuleCount: 1,
      overriddenRuleCount: 1,
      ruleTypeCounts: { any: 1, spHttp: 0, http: 0, aadHttp: 1, fetch: 1 },
    });
  });
});

describe('getAllConfiguredMockRules', () => {
  it('traverses Base and every scenario for bodyFile discovery', () => {
    const config: IMockConfig = {
      rules: [rule('Base', '/base')],
      scenarios: [
        { name: 'One', rules: [rule('One', '/one')] },
        { name: 'Two', rules: [rule('Two', '/two')] },
      ],
    };

    expect(
      getAllConfiguredMockRules(config).map((candidate) => candidate.name),
    ).toEqual(['Base', 'One', 'Two']);
  });
});
