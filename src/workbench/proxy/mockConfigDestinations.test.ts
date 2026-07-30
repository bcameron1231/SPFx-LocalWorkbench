import { describe, expect, it } from 'vitest';

import { appendMockRules } from './mockConfigDestinations';
import type { IMockConfig, IMockRule } from './types';

function rule(name: string, status: number = 200): IMockRule {
  return {
    name,
    match: { url: `/${name.toLowerCase()}` },
    response: { status },
  };
}

describe('appendMockRules', () => {
  const config: IMockConfig = {
    rules: [rule('Base')],
    scenarios: [{ name: 'Errors', description: 'Failure responses', rules: [] }],
  };

  it('appends to Base or an existing scenario without mutating the source', () => {
    const baseResult = appendMockRules(config, [rule('Added')], {
      destinationType: 'base',
    });
    const scenarioResult = appendMockRules(config, [rule('Failure', 500)], {
      destinationType: 'scenario',
      scenarioName: 'Errors',
    });

    expect(baseResult.rules.map((candidate) => candidate.name)).toEqual([
      'Base',
      'Added',
    ]);
    expect(scenarioResult.scenarios?.[0].rules[0].response.status).toBe(500);
    expect(config.rules).toHaveLength(1);
    expect(config.scenarios?.[0].rules).toHaveLength(0);
  });

  it('creates a scenario and its rules in one result', () => {
    const result = appendMockRules({ rules: [] }, [rule('Populated')], {
      destinationType: 'new',
      scenarioName: 'Populated',
      description: 'Representative data',
    });

    expect(result).toEqual({
      rules: [],
      scenarios: [
        {
          name: 'Populated',
          description: 'Representative data',
          rules: [rule('Populated')],
        },
      ],
    });
  });

  it('rejects a new name that became duplicate before the write', () => {
    expect(() =>
      appendMockRules(config, [rule('Another')], {
        destinationType: 'new',
        scenarioName: 'Errors',
      }),
    ).toThrow('duplicate scenario name "Errors"');
  });

  it('rejects a destination removed before the write', () => {
    expect(() =>
      appendMockRules({ rules: [] }, [rule('Another')], {
        destinationType: 'scenario',
        scenarioName: 'Removed',
      }),
    ).toThrow('Scenario "Removed" no longer exists');
  });
});
