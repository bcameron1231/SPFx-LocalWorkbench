import { IconButton, WithTooltip } from '@storybook/components';
import { useGlobals, useParameter, useStorybookState } from '@storybook/manager-api';
import React, { useEffect, useMemo, useState } from 'react';

import {
  BASE_SCENARIO_LABEL,
  ScenarioIcon,
  ScenarioPickerDropdown,
  getProxyScenarioSummaries,
  validateMockConfig,
} from '@spfx-local-workbench/shared';
import type { IProxyScenarioSummary } from '@spfx-local-workbench/shared';

import { PARAM_KEY, STORYBOOK_GLOBAL_KEYS } from '../../constants';
import type { ISpfxParameters } from '../../types';

const DEFAULT_MOCK_CONFIG_URL = '/proxy/api-mocks.json';

/** Storybook manager toolbar for selecting additive proxy scenarios. */
export const ScenarioToolbar: React.FC = () => {
  const [globals, updateGlobals] = useGlobals();
  const { storyId } = useStorybookState();
  const parameters = useParameter<Partial<ISpfxParameters>>(PARAM_KEY, {});
  const [summaries, setSummaries] = useState<IProxyScenarioSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const mockFile = parameters.proxy?.mockFile ?? DEFAULT_MOCK_CONFIG_URL;
  const storyScenario = parameters.proxy?.scenario;
  const globalScenario =
    typeof globals[STORYBOOK_GLOBAL_KEYS.PROXY_SCENARIO] === 'string'
      ? (globals[STORYBOOK_GLOBAL_KEYS.PROXY_SCENARIO] as string)
      : undefined;

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const response = await window.fetch(mockFile);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const config = validateMockConfig(await response.json());
        if (cancelled) {
          return;
        }
        const nextSummaries = getProxyScenarioSummaries(config);
        setSummaries(nextSummaries);
        const seededScenario = storyScenario
          ? nextSummaries.find((summary) => summary.scenarioName === storyScenario)
              ?.scenarioName
          : undefined;
        if (storyScenario && !seededScenario) {
          console.warn(
            `[ScenarioToolbar] Scenario "${storyScenario}" was not found; using ${BASE_SCENARIO_LABEL}`,
          );
        }
        updateGlobals({
          [STORYBOOK_GLOBAL_KEYS.PROXY_SCENARIO]: seededScenario ?? null,
        });
      } catch (error) {
        if (!cancelled) {
          console.warn(`[ScenarioToolbar] Failed to load ${mockFile}:`, error);
          setSummaries([]);
          updateGlobals({ [STORYBOOK_GLOBAL_KEYS.PROXY_SCENARIO]: null });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [mockFile, storyId, storyScenario]);

  const currentSummary = useMemo(
    () =>
      summaries.find((summary) => summary.scenarioName === globalScenario) ??
      summaries[0],
    [globalScenario, summaries],
  );

  if (summaries.length <= 1) {
    return null;
  }

  const handleScenarioChange = (scenarioName?: string): void => {
    updateGlobals({
      [STORYBOOK_GLOBAL_KEYS.PROXY_SCENARIO]: scenarioName ?? null,
    });
    setIsOpen(false);
  };

  const tooltip = (
    <ScenarioPickerDropdown
      summaries={summaries}
      currentScenarioName={globalScenario}
      onSelect={handleScenarioChange}
    />
  );

  return (
    <WithTooltip
      placement="top"
      trigger="click"
      closeOnOutsideClick
      tooltip={tooltip}
      visible={isOpen}
      onVisibleChange={setIsOpen}
    >
      <IconButton
        title={`Proxy scenario: ${currentSummary?.name ?? BASE_SCENARIO_LABEL}`}
      >
        <ScenarioIcon />
        <span style={{ marginLeft: 4, fontSize: 11 }}>
          {currentSummary?.enabledRuleCount ?? 0}
        </span>
      </IconButton>
    </WithTooltip>
  );
};
