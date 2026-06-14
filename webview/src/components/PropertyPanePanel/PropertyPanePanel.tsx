import { Panel, PanelType, PrimaryButton, Separator, Stack, Text } from '@fluentui/react';
import React, { FC, useCallback, useEffect, useState } from 'react';

import { PropertyPaneFieldType, getLocalizedString, logger } from '@spfx-local-workbench/shared';
import type { IActiveWebPart } from '@spfx-local-workbench/shared';

import styles from './PropertyPanePanel.module.css';
import {
  ButtonComponent,
  CheckboxComponent,
  ChoiceGroupComponent,
  CustomFieldComponent,
  DropdownComponent,
  HeadingComponent,
  LabelComponent,
  LinkComponent,
  SliderComponent,
  TextFieldComponent,
  ToggleComponent,
} from './components';

interface IPropertyPanePanelProps {
  webPart?: IActiveWebPart;
  onClose: () => void;
  onPropertyChange: (targetProperty: string, newValue: any) => void;
}

export const PropertyPanePanel: FC<IPropertyPanePanelProps> = ({
  webPart,
  onClose,
  onPropertyChange,
}) => {
  const [config, setConfig] = useState<any>(null);
  const pageContextLocale = webPart?.context?.pageContext?.cultureInfo?.currentUICultureName;
  const locale = pageContextLocale || navigator.language; //TODO: This is temporary, will pull from larger context
  const preconfiguredEntry =
    webPart?.manifest.preconfiguredEntries?.[webPart.preconfiguredEntryIndex ?? 0] ??
    webPart?.manifest.preconfiguredEntries?.[0];
  const headerText =
    getLocalizedString(preconfiguredEntry?.title, locale) ||
    webPart?.manifest.alias ||
    'Properties';

  // Check if the web part has disabled reactive property changes
  const isNonReactive =
    webPart?.instance &&
    'disableReactivePropertyChanges' in webPart.instance &&
    (webPart.instance as any).disableReactivePropertyChanges === true;

  // Buffer for pending property changes in non-reactive mode
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});

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
    // Reset pending changes when web part changes
    setPendingChanges({});
  }, [webPart]);

  // Handle property change - either buffer it or apply it immediately
  const handlePropertyChange = useCallback(
    (targetProperty: string, newValue: any) => {
      if (isNonReactive) {
        setPendingChanges((prev) => ({ ...prev, [targetProperty]: newValue }));
      } else {
        onPropertyChange(targetProperty, newValue);
      }
    },
    [isNonReactive, onPropertyChange],
  );

  // Apply all pending changes
  const handleApply = useCallback(() => {
    Object.entries(pendingChanges).forEach(([targetProperty, newValue]) => {
      onPropertyChange(targetProperty, newValue);
    });
    setPendingChanges({});
  }, [pendingChanges, onPropertyChange]);

  // Get the current value for a field (considering pending changes)
  const getCurrentValue = useCallback(
    (targetProperty: string) => {
      if (isNonReactive && targetProperty in pendingChanges) {
        return pendingChanges[targetProperty];
      }
      return targetProperty ? webPart?.properties[targetProperty] : undefined;
    },
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
          overflowY: 'none',
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
            webPart={webPart}
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
  config: any;
  webPart: IActiveWebPart;
  onPropertyChange: (targetProperty: string, newValue: any) => void;
  getCurrentValue: (targetProperty: string) => any;
}

const PropertyPaneContent: FC<IPropertyPaneContentProps> = ({
  config,
  webPart,
  onPropertyChange,
  getCurrentValue,
}) => {
  const page = config.pages[0];

  return (
    <Stack tokens={{ childrenGap: 16 }} className={styles.container}>
      {page.header?.description && (
        <div className={styles.pageHeader}>{page.header.description}</div>
      )}
      {(page.groups || []).map((group: any, groupIndex: number) => (
        <Stack key={groupIndex} tokens={{ childrenGap: 12 }} className={styles.group}>
          {!group.isGroupNameHidden && group.groupName && (
            <div className={styles.groupHeader}>{group.groupName}</div>
          )}
          <Stack tokens={{ childrenGap: 8 }} className={styles.groupFields}>
            {(group.groupFields || []).map((field: any, fieldIndex: number) => (
              <PropertyPaneField
                key={fieldIndex}
                field={field}
                webPart={webPart}
                currentValue={getCurrentValue(field.targetProperty)}
                onPropertyChange={onPropertyChange}
              />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};

interface IPropertyPaneFieldProps {
  field: any;
  webPart: IActiveWebPart;
  currentValue: any;
  onPropertyChange: (targetProperty: string, newValue: any) => void;
}

const PropertyPaneField: FC<IPropertyPaneFieldProps> = ({
  field,
  webPart,
  currentValue,
  onPropertyChange,
}) => {
  // Guard against null webPart
  if (!webPart) {
    return null;
  }

  const handleChange = (newValue: any) => {
    if (field.targetProperty) {
      onPropertyChange(field.targetProperty, newValue);
    }
  };

  switch (field.type) {
    case PropertyPaneFieldType.TextField:
      return <TextFieldComponent field={field} value={currentValue} onChange={handleChange} />;
    case PropertyPaneFieldType.CheckBox:
      return <CheckboxComponent field={field} value={currentValue} onChange={handleChange} />;
    case PropertyPaneFieldType.Toggle:
      return <ToggleComponent field={field} value={currentValue} onChange={handleChange} />;
    case PropertyPaneFieldType.Dropdown:
      return <DropdownComponent field={field} value={currentValue} onChange={handleChange} />;
    case PropertyPaneFieldType.Slider:
      return <SliderComponent field={field} value={currentValue} onChange={handleChange} />;
    case PropertyPaneFieldType.ChoiceGroup:
      return <ChoiceGroupComponent field={field} value={currentValue} onChange={handleChange} />;
    case PropertyPaneFieldType.Button:
      return <ButtonComponent field={field} />;
    case PropertyPaneFieldType.Label:
      return <LabelComponent field={field} />;
    case PropertyPaneFieldType.Heading:
      return <HeadingComponent field={field} />;
    case PropertyPaneFieldType.Link:
      return <LinkComponent field={field} />;
    case PropertyPaneFieldType.HorizontalRule:
      return <Separator />;
    case PropertyPaneFieldType.Custom:
      return <CustomFieldComponent field={field} value={currentValue} onChange={handleChange} />;
    case PropertyPaneFieldType.DynamicField:
      return <TextFieldComponent field={field} value={currentValue} onChange={handleChange} />;
    case PropertyPaneFieldType.DynamicFieldSet:
      return <Text className={styles.empty}>Dynamic Field Set (Not fully supported)</Text>;
    default:
      return <Text className={styles.required}>Unsupported field type: {field.type}</Text>;
  }
};
