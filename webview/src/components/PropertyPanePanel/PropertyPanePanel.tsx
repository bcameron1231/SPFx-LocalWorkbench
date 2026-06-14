import { Panel, PanelType, PrimaryButton, Stack, Text } from '@fluentui/react';
import React, { FC, useCallback, useEffect, useState } from 'react';

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
import type {
  IPropertyPaneConfigurationModel,
  IPropertyPanePageModel,
} from './types';

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
  const locale = resolvePropertyPaneLocale(webPart);
  const headerText = resolvePropertyPaneTitle(webPart, locale);

  const isNonReactive =
    webPart?.instance &&
    'disableReactivePropertyChanges' in webPart.instance &&
    (webPart.instance as any).disableReactivePropertyChanges === true;

  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (webPart?.instance && typeof webPart.instance.getPropertyPaneConfiguration === 'function') {
      try {
        const paneConfig = webPart.instance.getPropertyPaneConfiguration();
        setConfig(paneConfig);
      } catch (error: unknown) {
        logger.warn('Error getting property pane configuration:', error);
        setConfig(null);
      }
    } else {
      setConfig(null);
    }
    setPendingChanges({});
  }, [webPart]);

  const handlePropertyChange = useCallback(
    (targetProperty: string, newValue: unknown) => {
      if (isNonReactive) {
        setPendingChanges((prev) => ({ ...prev, [targetProperty]: newValue }));
      } else {
        onPropertyChange(targetProperty, newValue);
      }
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
      resolveFieldValue(targetProperty, webPart?.properties, pendingChanges, isNonReactive),
    [isNonReactive, pendingChanges, webPart?.properties],
  );

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
          paddingLeft: 20,
          paddingRight: 0,
          paddingBottom: 'calc(var(--workbench-status-bar-height) + 16px)',
        },
      }}
    >
      <div id="property-pane-content" className={styles.content}>
        {config && config.pages && config.pages.length > 0 && webPart ? (
          <PropertyPaneContent
            config={config}
            locale={locale}
            onPropertyChange={handlePropertyChange}
            getCurrentValue={getCurrentValue}
          />
        ) : (
          <Stack horizontalAlign="center" className={styles.empty}>
            <Text>No property pane configuration available for this web part.</Text>
          </Stack>
        )}
      </div>
    </Panel>
  );
};

interface IPropertyPaneContentProps {
  config: IPropertyPaneConfigurationModel;
  getCurrentValue: (targetProperty: string | undefined) => unknown;
  locale: string;
  onPropertyChange: (targetProperty: string, newValue: unknown) => void;
}

const PropertyPaneContent: FC<IPropertyPaneContentProps> = ({
  config,
  getCurrentValue,
  locale,
  onPropertyChange,
}) => {
  const page: IPropertyPanePageModel | undefined = config.pages[0];

  if (!page) {
    return null;
  }

  return (
    <Stack tokens={{ childrenGap: 16 }} className={styles.container}>
      {page.header?.description && (
        <div className={styles.pageHeader}>{page.header.description}</div>
      )}
      {page.groups.map((groupOrConditionalGroup, groupIndex: number) => {
        const group = resolveGroup(groupOrConditionalGroup);

        return (
          <Stack key={groupIndex} tokens={{ childrenGap: 12 }} className={styles.group}>
            {!group.isGroupNameHidden && group.groupName && (
              <div className={styles.groupHeader}>{group.groupName}</div>
            )}
            {!group.isCollapsed && (
              <Stack tokens={{ childrenGap: 8 }} className={styles.groupFields}>
                {group.groupFields.map((field, fieldIndex: number) => (
                  <PropertyPaneFieldRenderer
                    key={fieldIndex}
                    currentValue={getCurrentValue(field.targetProperty)}
                    field={field}
                    locale={locale}
                    onPropertyChange={onPropertyChange}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
};
