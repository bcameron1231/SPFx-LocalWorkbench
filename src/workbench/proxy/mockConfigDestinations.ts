import { getProxyScenario, validateMockConfig } from '@spfx-local-workbench/shared';

import type { IMockConfig, IMockRule, IProxyScenario } from './types';

/** Destination for appending generated mock rules. */
export type MockRuleDestination =
  | { destinationType: 'base' }
  | { destinationType: 'scenario'; scenarioName: string }
  | {
      destinationType: 'new';
      scenarioName: string;
      description?: string;
    };

/**
 * Creates a validated configuration with generated rules appended to one destination.
 * The input configuration is not mutated, so a new scenario and its rules can be
 * persisted in one atomic write.
 */
export function appendMockRules(
  config: IMockConfig,
  rules: readonly IMockRule[],
  destination: MockRuleDestination,
): IMockConfig {
  const nextConfig: IMockConfig = {
    ...config,
    rules: [...config.rules],
    ...(config.scenarios
      ? {
          scenarios: config.scenarios.map((scenario) => ({
            ...scenario,
            rules: [...scenario.rules],
          })),
        }
      : {}),
  };

  if (destination.destinationType === 'base') {
    nextConfig.rules.push(...rules);
  } else if (destination.destinationType === 'scenario') {
    const scenario = getProxyScenario(nextConfig, destination.scenarioName);
    if (!scenario) {
      throw new Error(`Scenario "${destination.scenarioName}" no longer exists`);
    }
    scenario.rules.push(...rules);
  } else {
    const scenario: IProxyScenario = {
      name: destination.scenarioName,
      ...(destination.description ? { description: destination.description } : {}),
      rules: [...rules],
    };
    nextConfig.scenarios = [...(nextConfig.scenarios ?? []), scenario];
  }

  return validateMockConfig(nextConfig);
}
