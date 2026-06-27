import {
  ContextualMenu,
  Icon,
  IconButton,
  Link,
  Panel,
  PanelType,
  PrimaryButton,
  Stack,
  css,
} from '@fluentui/react';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PropertyPaneFieldType } from '../../mocks/PropertyPaneMocks';
import type { IActiveWebPart } from '../../types';
import { logger } from '../../utils';

import { getPropertyPaneStrings } from './config';
import { PropertyPaneFieldRenderer } from './PropertyPaneFieldRenderer';
import styles from './PropertyPanePanel.module.css';
import {
  isConditionalGroup,
  resolveFieldValue,
  resolveGroup,
  resolvePropertyPaneLocale,
  resolvePropertyPaneTitle,
} from './shared';
import type {
  IPropertyPaneConfigurationModel,
  IPropertyPaneGroupModel,
  IPropertyPanePageModel,
} from './types';

const WORKBENCH_VISIBILITY_TARGET_PROPERTY = '__workbenchVisibility.showInMobileAndEmailView';
interface IPropertyPanePanelProps {
  includeWorkbenchVisibilityGroup?: boolean;
  webPart?: IActiveWebPart;
  onClose: () => void;
  onPropertyChange: (targetProperty: string, newValue: unknown) => void;
}

export const PropertyPanePanel: FC<IPropertyPanePanelProps> = ({
  includeWorkbenchVisibilityGroup = false,
  webPart,
  onClose,
  onPropertyChange,
}) => {
  const [config, setConfig] = useState<IPropertyPaneConfigurationModel | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [invalidProperties, setInvalidProperties] = useState<Record<string, boolean>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [openConditionalMenuGroupKey, setOpenConditionalMenuGroupKey] = useState<string>();
  const [focusFieldKey, setFocusFieldKey] = useState<string>();
  const [showInMobileAndEmailView, setShowInMobileAndEmailView] = useState(true);
  const previousInstanceIdRef = useRef<string | undefined>();

  const locale = resolvePropertyPaneLocale(webPart);
  const propertyPaneStrings = getPropertyPaneStrings();
  const headerText = resolvePropertyPaneTitle(
    webPart,
    locale,
    propertyPaneStrings.defaultHeaderText,
  );

  const isNonReactive =
    webPart?.instance &&
    'disableReactivePropertyChanges' in webPart.instance &&
    (webPart.instance as { disableReactivePropertyChanges?: boolean })
      .disableReactivePropertyChanges === true;

  const refreshPropertyPaneConfiguration = useCallback(
    (options?: { preserveCurrentPage?: boolean; preserveGroupState?: boolean }) => {
      if (
        !webPart?.instance ||
        typeof webPart.instance.getPropertyPaneConfiguration !== 'function'
      ) {
        setConfig(null);
        return;
      }

      try {
        const paneConfig =
          webPart.instance.getPropertyPaneConfiguration() as IPropertyPaneConfigurationModel;
        setConfig(paneConfig);

        if (options?.preserveCurrentPage) {
          setCurrentPageIndex((prev) =>
            Math.max(0, Math.min(prev, Math.max(0, paneConfig.pages.length - 1))),
          );
        } else {
          setCurrentPageIndex(
            Math.max(0, Math.min(paneConfig.currentPage ?? 0, paneConfig.pages.length - 1)),
          );
        }

        if (options?.preserveGroupState) {
          setCollapsedGroups((prev) =>
            mergeCollapsedGroupState(prev, paneConfig, includeWorkbenchVisibilityGroup),
          );
        } else {
          setCollapsedGroups(buildCollapsedGroupState(paneConfig, includeWorkbenchVisibilityGroup));
        }
      } catch (error: unknown) {
        logger.warn('Error getting property pane configuration:', error);
        setConfig(null);
      }
    },
    [includeWorkbenchVisibilityGroup, webPart],
  );

  useEffect(() => {
    const previousInstanceId = previousInstanceIdRef.current;
    const currentInstanceId = webPart?.instanceId;
    const isSameWebPart = !!currentInstanceId && currentInstanceId === previousInstanceId;

    refreshPropertyPaneConfiguration({
      preserveCurrentPage: isSameWebPart,
      preserveGroupState: isSameWebPart,
    });

    if (!isSameWebPart) {
      setInvalidProperties({});
      setPendingChanges({});
      setFocusFieldKey(undefined);
      setOpenConditionalMenuGroupKey(undefined);
      setShowInMobileAndEmailView(true);
    }

    previousInstanceIdRef.current = currentInstanceId;
  }, [refreshPropertyPaneConfiguration, webPart]);

  const handlePropertyChange = useCallback(
    (targetProperty: string, newValue: unknown) => {
      if (targetProperty === WORKBENCH_VISIBILITY_TARGET_PROPERTY) {
        // TODO: Use this workbench-only visibility state to drive simulated mobile/email rendering.
        setShowInMobileAndEmailView(newValue !== false);
        return;
      }

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

  const handleFieldValidityChange = useCallback((targetProperty: string, isValid: boolean) => {
    setInvalidProperties((prev) => {
      if (isValid) {
        if (!(targetProperty in prev)) {
          return prev;
        }

        const next = { ...prev };
        delete next[targetProperty];
        return next;
      }

      if (prev[targetProperty]) {
        return prev;
      }

      return {
        ...prev,
        [targetProperty]: true,
      };
    });
  }, []);

  const getCurrentValue = useCallback(
    (targetProperty: string | undefined) => {
      if (targetProperty === WORKBENCH_VISIBILITY_TARGET_PROPERTY) {
        return showInMobileAndEmailView;
      }

      return resolveFieldValue(
        targetProperty,
        webPart?.properties,
        pendingChanges,
        !!isNonReactive,
      );
    },
    [isNonReactive, pendingChanges, showInMobileAndEmailView, webPart?.properties],
  );

  const page = useMemo<IPropertyPanePageModel>(
    () =>
      config?.pages[currentPageIndex] ?? {
        groups: [],
      },
    [config, currentPageIndex],
  );

  const pageGroups = useMemo(() => {
    if (!config) {
      return [];
    }

    if (config.pages.length > 1 && currentPageIndex !== 0) {
      return page.groups;
    }

    return includeWorkbenchVisibilityGroup
      ? [...page.groups, createWorkbenchVisibilityGroup()]
      : page.groups;
  }, [config, currentPageIndex, includeWorkbenchVisibilityGroup, page]);

  useEffect(() => {
    if (!config) {
      setFocusFieldKey(undefined);
      return;
    }

    const nextFocusField = findFirstFocusedField(pageGroups, currentPageIndex, collapsedGroups);
    setFocusFieldKey(nextFocusField);
  }, [collapsedGroups, config, currentPageIndex, pageGroups]);

  const hasPages = config && config.pages.length > 1;
  const pageNavigation = useMemo(() => {
    if (!config || config.pages.length <= 1) {
      return null;
    }

    const pageCountText = propertyPaneStrings.pageCountText
      .replace('{0}', String(currentPageIndex + 1))
      .replace('{1}', String(config.pages.length));

    return (
      <div className={styles.pageNavigation}>
        <button
          type="button"
          className={styles.pageNavigationButton}
          disabled={currentPageIndex === 0}
          onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
        >
          <Icon className={styles.pageNavigationIcon} iconName="ChevronLeft" />
          <span>{propertyPaneStrings.backButtonText}</span>
        </button>
        <div className={styles.pageNavigationCount}>{pageCountText}</div>
        <button
          type="button"
          className={styles.pageNavigationButton}
          disabled={currentPageIndex >= config.pages.length - 1}
          onClick={() => setCurrentPageIndex((prev) => Math.min(config.pages.length - 1, prev + 1))}
        >
          <span>{propertyPaneStrings.nextButtonText}</span>
          <Icon className={styles.pageNavigationIcon} iconName="ChevronRight" />
        </button>
      </div>
    );
  }, [
    config,
    currentPageIndex,
    propertyPaneStrings.backButtonText,
    propertyPaneStrings.nextButtonText,
    propertyPaneStrings.pageCountText,
  ]);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;
  const hasInvalidProperties = Object.keys(invalidProperties).length > 0;

  const renderFooter = useMemo(() => {
    if (isNonReactive) {
      return () => (
        <Stack horizontal={false} tokens={{ childrenGap: 20 }}>
          <PrimaryButton
            text={propertyPaneStrings.applyButtonText}
            onClick={handleApply}
            disabled={!hasPendingChanges || hasInvalidProperties}
            styles={{ root: { width: 'fit-content' } }}
          />
          {pageNavigation}
        </Stack>
      );
    }

    if (hasPages) {
      return () => pageNavigation;
    }

    return undefined;
  }, [
    handleApply,
    hasInvalidProperties,
    hasPages,
    hasPendingChanges,
    isNonReactive,
    pageNavigation,
    propertyPaneStrings.applyButtonText,
  ]);

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
      isFooterAtBottom={!!renderFooter}
      onRenderFooterContent={renderFooter}
      layerProps={{ eventBubblingEnabled: true }}
      styles={{
        main: {
          top: 0,
          bottom: 'var(--workbench-status-bar-height, 0px)',
          height: 'calc(100vh - var(--workbench-status-bar-height, 0px))',
          zIndex: 'var(--workbench-layer-property-pane, 1000)',
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
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
        },
      }}
    >
      <div id="property-pane-content" className={styles.content}>
        {config && webPart && (
          <Stack className={styles.container}>
            <div className={styles.pageContent}>
              {page.header?.description && (
                <div className={styles.pageHeader}>{page.header.description}</div>
              )}
              {pageGroups.map((groupOrConditionalGroup, groupIndex: number) => {
                const conditionalGroup = isConditionalGroup(groupOrConditionalGroup)
                  ? groupOrConditionalGroup
                  : undefined;
                const group = resolveGroup(groupOrConditionalGroup);
                const groupKey = getGroupKey(currentPageIndex, groupIndex);
                const isCollapsed = collapsedGroups[groupKey] ?? !!group.isCollapsed;
                const isAccordion = !!page.displayGroupsAsAccordion;
                const conditionalMenuTargetId = `conditional-group-menu-${groupKey}`;
                const isConditionalMenuOpen = openConditionalMenuGroupKey === groupKey;
                const showConditionalMenu =
                  !!conditionalGroup && !conditionalGroup.showSecondaryGroup;

                return (
                  <div key={groupKey} className={styles.groupContainer}>
                    {showConditionalMenu && (
                      <div className={styles.conditionalGroupActions}>
                        <IconButton
                          id={conditionalMenuTargetId}
                          ariaLabel={propertyPaneStrings.conditionalMenuAriaLabel}
                          className={styles.conditionalGroupMenuButton}
                          iconProps={{ iconName: 'More' }}
                          onClick={() =>
                            setOpenConditionalMenuGroupKey((prev) =>
                              prev === groupKey ? undefined : groupKey,
                            )
                          }
                          styles={{
                            root: {
                              borderRadius: 4,
                            },
                          }}
                        />
                        {isConditionalMenuOpen && (
                          <ContextualMenu
                            items={[
                              {
                                key: 'toggle-conditional-group',
                                text: propertyPaneStrings.conditionalConnectToSourceText,
                                iconProps: { iconName: 'Plug' },
                                onClick: () => {
                                  conditionalGroup?.onShowSecondaryGroup?.();
                                  refreshPropertyPaneConfiguration({
                                    preserveCurrentPage: true,
                                    preserveGroupState: true,
                                  });
                                  setOpenConditionalMenuGroupKey(undefined);
                                },
                              },
                            ]}
                            isBeakVisible={false}
                            target={`#${conditionalMenuTargetId}`}
                            onDismiss={() => setOpenConditionalMenuGroupKey(undefined)}
                            styles={{
                              root: {
                                borderRadius: 4,
                                paddingRight: 1,
                              },
                              subComponentStyles: {
                                callout: {
                                  root: {
                                    borderRadius: 4,
                                    paddingRight: 1,
                                  },
                                  calloutMain: {
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                  },
                                },
                                menuItem: {
                                  root: {
                                    fontWeight: 600,
                                    border: '1px solid var(--neutralSecondary)',
                                    borderRadius: 4,
                                    margin: 1,
                                    height: 30,
                                    lineHeight: 30,
                                    padding: '0 12px',
                                    selectors: {
                                      ':hover': {
                                        borderColor: 'var(--neutralTertiary)',
                                        backgroundColor: 'var(--neutralLighter)',
                                      },
                                    },
                                  },
                                  icon: {
                                    color: 'var(--neutralPrimary) !important',
                                    fontSize: '16px !important',
                                    width: 16,
                                  },
                                  label: {
                                    marginBottom: 2,
                                  },
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                    )}
                    <Stack
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
                            <span
                              className={css(styles.groupHeaderText, styles.accordionHeaderText)}
                            >
                              {group.groupName}
                            </span>
                            <Icon
                              className={styles.accordionToggle}
                              ariaLabel={
                                isCollapsed
                                  ? propertyPaneStrings.expandGroupAriaLabel
                                  : propertyPaneStrings.collapseGroupAriaLabel
                              }
                              iconName={isCollapsed ? 'ChevronDown' : 'ChevronUp'}
                            />
                          </button>
                        ) : (
                          <div className={styles.groupHeader}>
                            <span className={styles.groupHeaderText}>{group.groupName}</span>
                          </div>
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
                                onFieldValidityChange={handleFieldValidityChange}
                                onPropertyChange={handlePropertyChange}
                                provider={webPart.context.dynamicDataProvider}
                              />
                            );
                          })}
                        </Stack>
                      )}
                    </Stack>
                    {conditionalGroup?.showSecondaryGroup && (
                      <div className={styles.conditionalGroupFooter}>
                        <Link
                          onClick={() => {
                            conditionalGroup.onShowPrimaryGroup?.();
                            refreshPropertyPaneConfiguration({
                              preserveCurrentPage: true,
                              preserveGroupState: true,
                            });
                          }}
                        >
                          {propertyPaneStrings.conditionalRemoveConnectionText}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Stack>
        )}
      </div>
    </Panel>
  );
};

function buildCollapsedGroupState(
  config: IPropertyPaneConfigurationModel,
  includeWorkbenchVisibilityGroup: boolean,
): Record<string, boolean> {
  const state: Record<string, boolean> = {};

  config.pages.forEach((page, pageIndex) => {
    const pageGroups = includeWorkbenchVisibilityGroup
      ? [...page.groups, createWorkbenchVisibilityGroup()]
      : page.groups;

    pageGroups.forEach(
      (groupOrConditionalGroup, groupIndex) => {
        const group = resolveGroup(groupOrConditionalGroup);
        state[getGroupKey(pageIndex, groupIndex)] = !!group.isCollapsed;
      },
    );
  });

  return state;
}

function mergeCollapsedGroupState(
  existingState: Record<string, boolean>,
  config: IPropertyPaneConfigurationModel,
  includeWorkbenchVisibilityGroup: boolean,
): Record<string, boolean> {
  const nextState = buildCollapsedGroupState(config, includeWorkbenchVisibilityGroup);

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
  pageGroups: IPropertyPanePageModel['groups'],
  pageIndex: number,
  collapsedGroups: Record<string, boolean>,
): string | undefined {
  for (let groupIndex = 0; groupIndex < pageGroups.length; groupIndex += 1) {
    const group = resolveGroup(pageGroups[groupIndex]);
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

function createWorkbenchVisibilityGroup(): IPropertyPaneGroupModel {
  const propertyPaneStrings = getPropertyPaneStrings();

  return {
    groupName: propertyPaneStrings.visibilityGroupName,
    isCollapsed: false,
    groupFields: [
      {
        type: PropertyPaneFieldType.Toggle,
        targetProperty: WORKBENCH_VISIBILITY_TARGET_PROPERTY,
        properties: {
          label: propertyPaneStrings.visibilityToggleLabel,
          offText: propertyPaneStrings.visibilityToggleOffText,
          onText: propertyPaneStrings.visibilityToggleOnText,
        },
      },
    ],
  };
}
