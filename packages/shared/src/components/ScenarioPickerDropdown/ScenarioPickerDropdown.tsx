import { css } from '@fluentui/react';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { BASE_SCENARIO_KEY } from '../../proxy/scenarios';
import type {
  IProxyRuleTypeCounts,
  IProxyScenarioSummary,
} from '../../proxy/scenarios';
import styles from './ScenarioPickerDropdown.module.css';

export interface IScenarioPickerStrings {
  ariaLabel: string;
  activeRules: string;
  disabledRules: string;
  addedRules: string;
  overriddenRules: string;
  clientAny: string;
  clientSpHttp: string;
  clientHttp: string;
  clientAadHttp: string;
  clientFetch: string;
}

export interface IScenarioPickerDropdownProps {
  /** Base followed by configured scenario summaries */
  summaries: IProxyScenarioSummary[];
  /** Undefined represents Base rules */
  currentScenarioName?: string;
  /** Called when Base or a scenario is selected */
  onSelect: (scenarioName?: string) => void;
  /** Visual treatment for the host surface */
  variant?: 'm365' | 'vscode';
  /** Autofocus the current option when mounted */
  autoFocusSelected?: boolean;
  /** Called when Escape dismisses the containing popup */
  onEscape?: () => void;
  /** Disable selection while the host applies a scenario */
  disabled?: boolean;
  /** Optional localized strings */
  strings?: Partial<IScenarioPickerStrings>;
}

const DEFAULT_STRINGS: IScenarioPickerStrings = {
  ariaLabel: 'Proxy scenario picker',
  activeRules: '{0} active',
  disabledRules: '{0} disabled',
  addedRules: '+{0} added',
  overriddenRules: '{0} overridden',
  clientAny: 'Any',
  clientSpHttp: 'SP',
  clientHttp: 'HTTP',
  clientAadHttp: 'AAD',
  clientFetch: 'fetch',
};

function format(template: string, value: number): string {
  return template.replace('{0}', String(value));
}

function getSummaryKey(summary: IProxyScenarioSummary): string {
  return summary.isBase ? BASE_SCENARIO_KEY : summary.scenarioName ?? summary.key;
}

function getCurrentKey(currentScenarioName?: string): string {
  return currentScenarioName ?? BASE_SCENARIO_KEY;
}

function getRuleTypeChips(
  counts: IProxyRuleTypeCounts,
  strings: IScenarioPickerStrings,
): Array<{ key: keyof IProxyRuleTypeCounts; label: string; count: number }> {
  const chips: Array<{
    key: keyof IProxyRuleTypeCounts;
    label: string;
    count: number;
  }> = [
    { key: 'any', label: strings.clientAny, count: counts.any },
    { key: 'spHttp', label: strings.clientSpHttp, count: counts.spHttp },
    { key: 'http', label: strings.clientHttp, count: counts.http },
    { key: 'aadHttp', label: strings.clientAadHttp, count: counts.aadHttp },
    { key: 'fetch', label: strings.clientFetch, count: counts.fetch },
  ];
  return chips.filter((chip) => chip.count > 0);
}

/** Shared accessible scenario menu used by Workbench and Storybook. */
export const ScenarioPickerDropdown: React.FC<IScenarioPickerDropdownProps> = ({
  summaries,
  currentScenarioName,
  onSelect,
  variant = 'm365',
  autoFocusSelected = false,
  onEscape,
  disabled = false,
  strings: providedStrings,
}) => {
  const strings = { ...DEFAULT_STRINGS, ...providedStrings };
  const optionKeys = useMemo(() => summaries.map(getSummaryKey), [summaries]);
  const selectedKey = getCurrentKey(currentScenarioName);
  const getValidKey = (key: string): string =>
    optionKeys.includes(key) ? key : (optionKeys[0] ?? BASE_SCENARIO_KEY);
  const [focusedKey, setFocusedKey] = useState(() => getValidKey(selectedKey));
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setFocusedKey(getValidKey(selectedKey));
  }, [selectedKey, optionKeys]);

  useEffect(() => {
    if (!autoFocusSelected || optionKeys.length === 0) {
      return;
    }
    const key = getValidKey(selectedKey);
    setFocusedKey(key);
    optionRefs.current[key]?.focus();
  }, [autoFocusSelected, selectedKey, optionKeys]);

  const focusByIndex = (index: number): void => {
    if (optionKeys.length === 0) {
      return;
    }
    const wrappedIndex = (index + optionKeys.length) % optionKeys.length;
    const key = optionKeys[wrappedIndex];
    setFocusedKey(key);
    optionRefs.current[key]?.focus();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    optionIndex: number,
    scenarioName?: string,
  ): void => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusByIndex(optionIndex + 1);
        return;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusByIndex(optionIndex - 1);
        return;
      case 'Home':
        event.preventDefault();
        focusByIndex(0);
        return;
      case 'End':
        event.preventDefault();
        focusByIndex(optionKeys.length - 1);
        return;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!disabled) {
          onSelect(scenarioName);
        }
        return;
      default:
        return;
    }
  };

  return (
    <div
      className={css(
        styles.dropdown,
        variant === 'vscode' ? styles.dropdownVscode : styles.dropdownM365,
      )}
      role="radiogroup"
      aria-label={strings.ariaLabel}
      aria-busy={disabled}
    >
      {summaries.map((summary, optionIndex) => {
        const key = getSummaryKey(summary);
        const isSelected = key === selectedKey;
        const typeChips = getRuleTypeChips(summary.ruleTypeCounts, strings);
        return (
          <button
            key={key}
            ref={(element) => {
              optionRefs.current[key] = element;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${summary.name}, ${format(
              strings.activeRules,
              summary.enabledRuleCount,
            )}`}
            disabled={disabled}
            tabIndex={focusedKey === key ? 0 : -1}
            className={css(
              styles.option,
              variant === 'vscode' ? styles.optionVscode : styles.optionM365,
              isSelected && styles.optionSelected,
            )}
            onFocus={() => setFocusedKey(key)}
            onClick={() => onSelect(summary.scenarioName)}
            onKeyDown={(event) =>
              handleKeyDown(event, optionIndex, summary.scenarioName)
            }
          >
            <span className={styles.optionHeader}>
              <span className={styles.optionName}>{summary.name}</span>
              {isSelected ? <span className={styles.selectedMark}>✓</span> : null}
            </span>
            {summary.description ? (
              <span className={styles.description}>{summary.description}</span>
            ) : null}
            <span className={styles.metrics}>
              <span>{format(strings.activeRules, summary.enabledRuleCount)}</span>
              {summary.disabledRuleCount > 0 ? (
                <span>{format(strings.disabledRules, summary.disabledRuleCount)}</span>
              ) : null}
              {!summary.isBase && summary.addedRuleCount > 0 ? (
                <span>{format(strings.addedRules, summary.addedRuleCount)}</span>
              ) : null}
              {!summary.isBase && summary.overriddenRuleCount > 0 ? (
                <span>{format(strings.overriddenRules, summary.overriddenRuleCount)}</span>
              ) : null}
            </span>
            {typeChips.length > 0 ? (
              <span className={styles.typeChips} aria-hidden="true">
                {typeChips.map((chip) => (
                  <span key={chip.key} className={styles.typeChip}>
                    {chip.label} {chip.count}
                  </span>
                ))}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
