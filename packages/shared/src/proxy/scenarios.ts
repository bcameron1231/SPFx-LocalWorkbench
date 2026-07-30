import type {
  ApiClientType,
  IMockConfig,
  IMockRule,
  IProxyScenario,
} from './types';

/** Display name for the built-in base-rules selection */
export const BASE_SCENARIO_LABEL = 'Base rules';

/** Stable internal key for the built-in base-rules selection */
export const BASE_SCENARIO_KEY = '__base_rules__';

const RESERVED_SCENARIO_NAMES = new Set(['base', 'base rules']);
const CLIENT_TYPES = new Set<ApiClientType>(['spHttp', 'http', 'aadHttp', 'fetch']);

/** Counts of enabled effective rules by client restriction */
export interface IProxyRuleTypeCounts {
  any: number;
  spHttp: number;
  http: number;
  aadHttp: number;
  fetch: number;
}

/** Picker-friendly information about Base rules or one configured scenario */
export interface IProxyScenarioSummary {
  /** Internal option key; Base uses BASE_SCENARIO_KEY */
  key: string;

  /** Undefined for Base rules, otherwise the configured scenario name */
  scenarioName?: string;

  /** Display label */
  name: string;

  /** Optional scenario description */
  description?: string;

  /** Whether this option represents the base rules without a scenario */
  isBase: boolean;

  /** Number of enabled rules in the effective rule set */
  enabledRuleCount: number;

  /** Number of disabled rules in the effective rule set */
  disabledRuleCount: number;

  /** Number of scenario rules appended after the base rules */
  addedRuleCount: number;

  /** Number of scenario rules replacing same-named base rules */
  overriddenRuleCount: number;

  /** Enabled effective rules grouped by client restriction */
  ruleTypeCounts: IProxyRuleTypeCounts;
}

/** Workbench/Storybook state needed to render a scenario picker */
export interface IProxyScenarioState {
  activeScenarioName?: string;
  summaries: IProxyScenarioSummary[];
  proxyActive: boolean;
  recording?: boolean;
}

/** Result of composing Base rules with one optional scenario */
export interface IComposedMockRules {
  scenario?: IProxyScenario;
  rules: IMockRule[];
  addedRuleCount: number;
  overriddenRuleCount: number;
  requestedScenarioFound: boolean;
}

/** Error thrown when an API mock configuration is structurally invalid */
export class MockConfigValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid mock configuration:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
    this.name = 'MockConfigValidationError';
  }
}

/** Returns whether a scenario name conflicts with the built-in Base selection. */
export function isReservedScenarioName(name: string): boolean {
  return RESERVED_SCENARIO_NAMES.has(name.trim().toLowerCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateRule(rule: unknown, path: string, issues: string[]): void {
  if (!isRecord(rule)) {
    issues.push(`${path} must be an object`);
    return;
  }

  if (
    rule.name !== undefined &&
    (typeof rule.name !== 'string' || rule.name.trim().length === 0)
  ) {
    issues.push(`${path}.name must be a non-empty string when provided`);
  }
  if (rule.disabled !== undefined && typeof rule.disabled !== 'boolean') {
    issues.push(`${path}.disabled must be a boolean when provided`);
  }

  if (!isRecord(rule.match)) {
    issues.push(`${path}.match must be an object`);
  } else {
    if (typeof rule.match.url !== 'string' || rule.match.url.length === 0) {
      issues.push(`${path}.match.url must be a non-empty string`);
    }
    if (rule.match.method !== undefined && typeof rule.match.method !== 'string') {
      issues.push(`${path}.match.method must be a string when provided`);
    }
    if (
      rule.match.clientType !== undefined &&
      !CLIENT_TYPES.has(rule.match.clientType as ApiClientType)
    ) {
      issues.push(`${path}.match.clientType must be spHttp, http, aadHttp, or fetch`);
    }
    if (rule.match.urlPattern !== undefined && typeof rule.match.urlPattern !== 'boolean') {
      issues.push(`${path}.match.urlPattern must be a boolean when provided`);
    }
  }

  if (!isRecord(rule.response)) {
    issues.push(`${path}.response must be an object`);
  } else {
    if (
      typeof rule.response.status !== 'number' ||
      !Number.isFinite(rule.response.status)
    ) {
      issues.push(`${path}.response.status must be a finite number`);
    }
    if (
      rule.response.delay !== undefined &&
      (typeof rule.response.delay !== 'number' ||
        !Number.isFinite(rule.response.delay) ||
        rule.response.delay < 0)
    ) {
      issues.push(`${path}.response.delay must be a non-negative finite number`);
    }
    if (
      rule.response.bodyFile !== undefined &&
      (typeof rule.response.bodyFile !== 'string' || rule.response.bodyFile.length === 0)
    ) {
      issues.push(`${path}.response.bodyFile must be a non-empty string when provided`);
    }
    if (rule.response.body !== undefined && rule.response.bodyFile !== undefined) {
      issues.push(`${path}.response cannot define both body and bodyFile`);
    }
    if (rule.response.headers !== undefined) {
      if (!isRecord(rule.response.headers)) {
        issues.push(`${path}.response.headers must be an object when provided`);
      } else if (
        Object.values(rule.response.headers).some((headerValue) => typeof headerValue !== 'string')
      ) {
        issues.push(`${path}.response.headers values must be strings`);
      }
    }
  }
}

function validateRuleCollection(rules: unknown, path: string, issues: string[]): void {
  if (!Array.isArray(rules)) {
    issues.push(`${path} must be an array`);
    return;
  }

  const namedRules = new Set<string>();
  rules.forEach((rule, index) => {
    validateRule(rule, `${path}[${index}]`, issues);
    if (isRecord(rule) && typeof rule.name === 'string' && rule.name.trim().length > 0) {
      if (namedRules.has(rule.name)) {
        issues.push(`${path} contains duplicate rule name "${rule.name}"`);
      }
      namedRules.add(rule.name);
    }
  });
}

/**
 * Validates an unknown value and returns it as IMockConfig.
 * Validation does not mutate or normalize the supplied configuration.
 */
export function validateMockConfig(value: unknown): IMockConfig {
  const issues: string[] = [];
  if (!isRecord(value)) {
    throw new MockConfigValidationError(['Configuration must be an object']);
  }

  if (
    value.delay !== undefined &&
    (typeof value.delay !== 'number' || !Number.isFinite(value.delay) || value.delay < 0)
  ) {
    issues.push('delay must be a non-negative finite number when provided');
  }

  validateRuleCollection(value.rules, 'rules', issues);

  if (value.scenarios !== undefined) {
    if (!Array.isArray(value.scenarios)) {
      issues.push('scenarios must be an array when provided');
    } else {
      const scenarioNames = new Set<string>();
      value.scenarios.forEach((scenario, index) => {
        const scenarioPath = `scenarios[${index}]`;
        if (!isRecord(scenario)) {
          issues.push(`${scenarioPath} must be an object`);
          return;
        }

        if (typeof scenario.name !== 'string' || scenario.name.trim().length === 0) {
          issues.push(`${scenarioPath}.name must be a non-empty string`);
        } else {
          if (scenario.name !== scenario.name.trim()) {
            issues.push(`${scenarioPath}.name must not have leading or trailing whitespace`);
          }
          if (isReservedScenarioName(scenario.name)) {
            issues.push(`${scenarioPath}.name "${scenario.name}" is reserved`);
          }
          if (scenarioNames.has(scenario.name)) {
            issues.push(`scenarios contains duplicate scenario name "${scenario.name}"`);
          }
          scenarioNames.add(scenario.name);
        }

        if (
          scenario.description !== undefined &&
          typeof scenario.description !== 'string'
        ) {
          issues.push(`${scenarioPath}.description must be a string when provided`);
        }
        validateRuleCollection(scenario.rules, `${scenarioPath}.rules`, issues);
      });
    }
  }

  if (issues.length > 0) {
    throw new MockConfigValidationError(issues);
  }

  return value as unknown as IMockConfig;
}

/**
 * Composes effective rules for Base or a named scenario.
 * Complete same-named replacements keep the base rule's original position.
 */
export function composeMockRules(
  config: IMockConfig,
  requestedScenarioName?: string,
): IComposedMockRules {
  const scenario = requestedScenarioName
    ? config.scenarios?.find((candidate) => candidate.name === requestedScenarioName)
    : undefined;
  const requestedScenarioFound = requestedScenarioName === undefined || scenario !== undefined;

  if (!scenario) {
    return {
      rules: [...config.rules],
      addedRuleCount: 0,
      overriddenRuleCount: 0,
      requestedScenarioFound,
    };
  }

  const rules = [...config.rules];
  const baseRuleIndexes = new Map<string, number>();
  config.rules.forEach((rule, index) => {
    if (rule.name) {
      baseRuleIndexes.set(rule.name, index);
    }
  });

  let addedRuleCount = 0;
  let overriddenRuleCount = 0;
  for (const scenarioRule of scenario.rules) {
    const baseIndex = scenarioRule.name
      ? baseRuleIndexes.get(scenarioRule.name)
      : undefined;
    if (baseIndex !== undefined) {
      rules[baseIndex] = scenarioRule;
      overriddenRuleCount++;
    } else {
      rules.push(scenarioRule);
      addedRuleCount++;
    }
  }

  return {
    scenario,
    rules,
    addedRuleCount,
    overriddenRuleCount,
    requestedScenarioFound,
  };
}

function summarizeRules(rules: readonly IMockRule[]): {
  enabledRuleCount: number;
  disabledRuleCount: number;
  ruleTypeCounts: IProxyRuleTypeCounts;
} {
  const ruleTypeCounts: IProxyRuleTypeCounts = {
    any: 0,
    spHttp: 0,
    http: 0,
    aadHttp: 0,
    fetch: 0,
  };

  let enabledRuleCount = 0;
  let disabledRuleCount = 0;
  for (const rule of rules) {
    if (rule.disabled) {
      disabledRuleCount++;
      continue;
    }

    enabledRuleCount++;
    const clientType = rule.match.clientType;
    if (clientType) {
      ruleTypeCounts[clientType]++;
    } else {
      ruleTypeCounts.any++;
    }
  }

  return { enabledRuleCount, disabledRuleCount, ruleTypeCounts };
}

/** Builds picker summaries for Base rules followed by every configured scenario. */
export function getProxyScenarioSummaries(config: IMockConfig): IProxyScenarioSummary[] {
  const baseRuleSummary = summarizeRules(config.rules);
  const summaries: IProxyScenarioSummary[] = [
    {
      key: BASE_SCENARIO_KEY,
      name: BASE_SCENARIO_LABEL,
      isBase: true,
      addedRuleCount: 0,
      overriddenRuleCount: 0,
      ...baseRuleSummary,
    },
  ];

  for (const scenario of config.scenarios ?? []) {
    const composed = composeMockRules(config, scenario.name);
    summaries.push({
      key: scenario.name,
      scenarioName: scenario.name,
      name: scenario.name,
      description: scenario.description,
      isBase: false,
      addedRuleCount: composed.addedRuleCount,
      overriddenRuleCount: composed.overriddenRuleCount,
      ...summarizeRules(composed.rules),
    });
  }

  return summaries;
}

/** Returns the configured scenario matching an exact name. */
export function getProxyScenario(
  config: IMockConfig,
  scenarioName?: string,
): IProxyScenario | undefined {
  return scenarioName
    ? config.scenarios?.find((scenario) => scenario.name === scenarioName)
    : undefined;
}

/** Returns base and scenario rules in configuration order. */
export function getAllConfiguredMockRules(config: IMockConfig): readonly IMockRule[] {
  return [
    ...config.rules,
    ...(config.scenarios ?? []).flatMap((scenario) => scenario.rules),
  ];
}
