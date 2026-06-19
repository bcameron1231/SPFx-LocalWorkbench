import {
  DefaultButton,
  Icon,
  IconButton,
  Panel,
  PanelType,
  PrimaryButton,
  Stack,
  Text,
  css,
} from '@fluentui/react';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { logger } from '@spfx-local-workbench/shared';
import type { IActiveWebPart } from '@spfx-local-workbench/shared';

import { PropertyPaneFieldRenderer } from './PropertyPaneFieldRenderer';
import styles from './PropertyPanePanel.module.css';
import {
  resolveFieldValue,
  resolveGroup,
  resolvePropertyPaneLocale,
  resolvePropertyPaneTitle,
} from './shared';
import type { IPropertyPaneConfigurationModel, IPropertyPanePageModel } from './types';

interface IPropertyPanePanelProps {
  webPart?: IActiveWebPart;
  onClose: () => void;
  onPropertyChange: (targetProperty: string, newValue: unknown) => void;
}

export const PropertyPanePanel: FC<IPropertyPanePanelProps> = ({
  webPart,
  onClose,
  onPropertyChange,
}) => {
  const [config, setConfig] = useState<IPropertyPaneConfigurationModel | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [focusFieldKey, setFocusFieldKey] = useState<string>();
  const previousInstanceIdRef = useRef<string | undefined>();

  const locale = resolvePropertyPaneLocale(webPart);
  const headerText = resolvePropertyPaneTitle(webPart, locale);

  const isNonReactive =
    webPart?.instance &&
    'disableReactivePropertyChanges' in webPart.instance &&
    (webPart.instance as { disableReactivePropertyChanges?: boolean })
      .disableReactivePropertyChanges === true;

  useEffect(() => {
    const previousInstanceId = previousInstanceIdRef.current;
    const currentInstanceId = webPart?.instanceId;
    const isSameWebPart = !!currentInstanceId && currentInstanceId === previousInstanceId;

    if (webPart?.instance && typeof webPart.instance.getPropertyPaneConfiguration === 'function') {
      try {
        const paneConfig =
          webPart.instance.getPropertyPaneConfiguration() as IPropertyPaneConfigurationModel;
        setConfig(paneConfig);

        if (isSameWebPart) {
          setCurrentPageIndex((prev) =>
            Math.max(0, Math.min(prev, Math.max(0, paneConfig.pages.length - 1))),
          );
          setCollapsedGroups((prev) => mergeCollapsedGroupState(prev, paneConfig));
        } else {
          setCurrentPageIndex(
            Math.max(0, Math.min(paneConfig.currentPage ?? 0, paneConfig.pages.length - 1)),
          );
          setCollapsedGroups(buildCollapsedGroupState(paneConfig));
        }
      } catch (error: unknown) {
        logger.warn('Error getting property pane configuration:', error);
        setConfig(null);
      }
    } else {
      setConfig(null);
    }

    if (!isSameWebPart) {
      setPendingChanges({});
      setFocusFieldKey(undefined);
    }

    previousInstanceIdRef.current = currentInstanceId;
  }, [webPart]);

  const handlePropertyChange = useCallback(
    (targetProperty: string, newValue: unknown) => {
      if (isNonReactive) {
        setPendingChanges((prev) => ({ ...prev, [targetProperty]: newValue }));
        return;
      }

      onPropertyChange(targetProperty, newValue);
    },
    [isNonReactive, onPropertyChange],
  );

  const handleApply = useCallback(() => {
    Object.entries(pendingChanges).forEach(([targetProperty, newValue]) => {
      onPropertyChange(targetProperty, newValue);
    });
    setPendingChanges({});
  }, [pendingChanges, onPropertyChange]);

  const getCurrentValue = useCallback(
    (targetProperty: string | undefined) =>
      resolveFieldValue(targetProperty, webPart?.properties, pendingChanges, !!isNonReactive),
    [isNonReactive, pendingChanges, webPart?.properties],
  );

  const page = config?.pages[currentPageIndex];

  useEffect(() => {
    if (!page) {
      setFocusFieldKey(undefined);
      return;
    }

    const nextFocusField = findFirstFocusedField(page, currentPageIndex, collapsedGroups);
    setFocusFieldKey(nextFocusField);
  }, [collapsedGroups, currentPageIndex, page]);

  const pageButtons = useMemo(() => {
    if (!config || config.pages.length <= 1) {
      return null;
    }

    return (
      <Stack horizontal tokens={{ childrenGap: 8 }} className={styles.pageNavigation}>
        {config.pages.map((_, pageIndex) => (
          <DefaultButton
            key={pageIndex}
            text={`Page ${pageIndex + 1}`}
            primary={pageIndex === currentPageIndex}
            onClick={() => setCurrentPageIndex(pageIndex)}
          />
        ))}
      </Stack>
    );
  }, [config, currentPageIndex]);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const renderFooter = isNonReactive
    ? () => (
        <PrimaryButton
          text="Apply"
          onClick={handleApply}
          disabled={!hasPendingChanges}
          styles={{ root: { width: 'fit-content' } }}
        />
      )
    : undefined;

  return (
    <Panel
      id="property-pane"
      isOpen={!!webPart}
      type={PanelType.custom}
      customWidth="340px"
      headerText={headerText}
      headerClassName={styles.panelHeader}
      onDismiss={onClose}
      isBlocking={false}
      isFooterAtBottom={isNonReactive}
      onRenderFooterContent={renderFooter}
      layerProps={{ eventBubblingEnabled: true }}
      styles={{
        main: {
          top: 0,
          bottom: 'var(--workbench-status-bar-height)',
          height: 'calc(100vh - var(--workbench-status-bar-height))',
          zIndex: 'var(--workbench-layer-property-pane)',
        },
        scrollableContent: {
          overflowY: 'hidden',
        },
        commands: {
          paddingTop: 28,
          paddingBottom: 10,
        },
        header: {
          paddingLeft: 20,
          paddingRight: 4,
          maxWidth: 'calc(100% - 44px)',
        },
        content: {
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 70px)', // Account for header
          minHeight: 0,
          paddingLeft: 0,
          paddingRight: 0,
        },
      }}
    >
      <div id="property-pane-content" className={styles.content}>
        {config && page && webPart ? (
          <Stack className={styles.container}>
            {pageButtons}
            {page.header?.description && (
              <div className={styles.pageHeader}>{page.header.description}</div>
            )}
            {page.groups.map((groupOrConditionalGroup, groupIndex: number) => {
              const group = resolveGroup(groupOrConditionalGroup);
              const groupKey = getGroupKey(currentPageIndex, groupIndex);
              const isCollapsed = collapsedGroups[groupKey] ?? !!group.isCollapsed;
              const isAccordion = !!page.displayGroupsAsAccordion;

              return (
                <Stack
                  key={groupKey}
                  className={css(
                    styles.group,
                    isAccordion && styles.accordionGroup,
                    isCollapsed && styles.collapsed,
                  )}
                >
                  {!group.isGroupNameHidden &&
                    group.groupName &&
                    (isAccordion ? (
                      <button
                        type="button"
                        className={css(styles.accordionHeader, styles.groupHeader)}
                        onClick={() =>
                          setCollapsedGroups((prev) => ({
                            ...prev,
                            [groupKey]: !isCollapsed,
                          }))
                        }
                      >
                        <span>{group.groupName}</span>
                        <Icon
                          className={styles.accordionToggle}
                          ariaLabel={isCollapsed ? 'Expand group' : 'Collapse group'}
                          iconName={isCollapsed ? 'ChevronDown' : 'ChevronUp'}
                        />
                      </button>
                    ) : (
                      <div className={styles.groupHeader}>{group.groupName}</div>
                    ))}
                  {!isCollapsed && (
                    <Stack className={styles.groupFields}>
                      {group.groupFields.map((field, fieldIndex: number) => {
                        const fieldKey = `${groupKey}-${fieldIndex}-${field.targetProperty}`;
                        return (
                          <PropertyPaneFieldRenderer
                            key={fieldKey}
                            autoFocus={focusFieldKey === fieldKey}
                            currentValue={getCurrentValue(field.targetProperty)}
                            field={field}
                            getCurrentValue={getCurrentValue}
                            locale={locale}
                            onPropertyChange={handlePropertyChange}
                            provider={webPart.context.dynamicDataProvider}
                          />
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              );
            })}
          </Stack>
        ) : (
          <Stack horizontalAlign="center" className={styles.empty}>
            <Text>No property pane configuration available for this web part.</Text>
          </Stack>
        )}
      </div>
    </Panel>
  );
};

function buildCollapsedGroupState(
  config: IPropertyPaneConfigurationModel,
): Record<string, boolean> {
  const state: Record<string, boolean> = {};

  config.pages.forEach((page, pageIndex) => {
    page.groups.forEach((groupOrConditionalGroup, groupIndex) => {
      const group = resolveGroup(groupOrConditionalGroup);
      state[getGroupKey(pageIndex, groupIndex)] = !!group.isCollapsed;
    });
  });

  return state;
}

function mergeCollapsedGroupState(
  existingState: Record<string, boolean>,
  config: IPropertyPaneConfigurationModel,
): Record<string, boolean> {
  const nextState = buildCollapsedGroupState(config);

  Object.keys(nextState).forEach((groupKey) => {
    if (groupKey in existingState) {
      nextState[groupKey] = existingState[groupKey];
    }
  });

  return nextState;
}

function getGroupKey(pageIndex: number, groupIndex: number): string {
  return `${pageIndex}-${groupIndex}`;
}

function findFirstFocusedField(
  page: IPropertyPanePageModel,
  pageIndex: number,
  collapsedGroups: Record<string, boolean>,
): string | undefined {
  for (let groupIndex = 0; groupIndex < page.groups.length; groupIndex += 1) {
    const group = resolveGroup(page.groups[groupIndex]);
    if (collapsedGroups[getGroupKey(pageIndex, groupIndex)]) {
      continue;
    }

    for (let fieldIndex = 0; fieldIndex < group.groupFields.length; fieldIndex += 1) {
      const field = group.groupFields[fieldIndex];
      if (field.shouldFocus) {
        return `${getGroupKey(pageIndex, groupIndex)}-${fieldIndex}-${field.targetProperty}`;
      }
    }
  }

  return undefined;
}
