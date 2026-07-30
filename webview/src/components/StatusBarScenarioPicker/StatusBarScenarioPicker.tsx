import { css } from '@fluentui/react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import {
  BASE_SCENARIO_LABEL,
  ScenarioIcon,
  ScenarioPickerDropdown,
} from '@spfx-local-workbench/shared';
import type {
  IProxyScenarioState,
  IProxyScenarioSummary,
} from '@spfx-local-workbench/shared';

import styles from './StatusBarScenarioPicker.module.css';

const EMPTY_STATE: IProxyScenarioState = {
  summaries: [],
  proxyActive: false,
};

function getCurrentSummary(state: IProxyScenarioState): IProxyScenarioSummary | undefined {
  return state.summaries.find(
    (summary) => summary.scenarioName === state.activeScenarioName,
  );
}

/** Workbench status-bar wrapper around the shared proxy scenario picker. */
export const StatusBarScenarioPicker: React.FC = () => {
  const popupIdRef = useRef(
    `status-bar-scenario-picker-${Math.random().toString(36).slice(2, 10)}`,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<IProxyScenarioState>(EMPTY_STATE);
  const [isOpen, setIsOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const stateHandler = (event: Event) => {
      setState((event as CustomEvent<IProxyScenarioState>).detail);
    };
    const applyingHandler = () => setIsApplying(true);
    const appliedHandler = () => setIsApplying(false);
    const errorHandler = () => setIsApplying(false);
    window.addEventListener('workbenchProxyScenarioStateUpdated', stateHandler);
    window.addEventListener('workbenchProxyScenarioApplying', applyingHandler);
    window.addEventListener('workbenchProxyScenarioApplied', appliedHandler);
    window.addEventListener('workbenchProxyScenarioSelectionError', errorHandler);
    return () => {
      window.removeEventListener('workbenchProxyScenarioStateUpdated', stateHandler);
      window.removeEventListener('workbenchProxyScenarioApplying', applyingHandler);
      window.removeEventListener('workbenchProxyScenarioApplied', appliedHandler);
      window.removeEventListener('workbenchProxyScenarioSelectionError', errorHandler);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (state.summaries.length <= 1) {
    return null;
  }

  const currentSummary = getCurrentSummary(state) ?? state.summaries[0];
  const currentLabel = currentSummary?.isBase ? 'Base' : currentSummary?.name;
  const selectionDisabled = isApplying || state.recording === true;
  const inactiveText = state.proxyActive ? '' : ' Proxy rules are currently inactive.';
  const title = `Proxy scenario: ${currentSummary?.name ?? BASE_SCENARIO_LABEL}.${inactiveText}`;

  const handleSelect = (scenarioName?: string): void => {
    if (selectionDisabled) {
      return;
    }
    setIsApplying(true);
    setIsOpen(false);
    triggerRef.current?.focus();
    window.dispatchEvent(
      new CustomEvent('workbenchProxyScenarioChanged', { detail: { scenarioName } }),
    );
  };

  const handleDismiss = (): void => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={css(styles.container, !state.proxyActive && styles.inactive)}
    >
      {isOpen ? (
        <div id={popupIdRef.current} className={styles.popup}>
          <ScenarioPickerDropdown
            summaries={state.summaries}
            currentScenarioName={state.activeScenarioName}
            onSelect={handleSelect}
            variant="vscode"
            autoFocusSelected
            onEscape={handleDismiss}
            disabled={selectionDisabled}
          />
        </div>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        title={title}
        aria-label={title}
        aria-expanded={isOpen}
        aria-controls={isOpen ? popupIdRef.current : undefined}
        aria-busy={isApplying}
        disabled={selectionDisabled}
        onClick={() => setIsOpen((open) => !open)}
      >
        <ScenarioIcon className={styles.icon} />
        <span className={styles.name}>{currentLabel}</span>
        <span className={styles.count}>{currentSummary?.enabledRuleCount ?? 0}</span>
      </button>
    </div>
  );
};
