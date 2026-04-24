import { IconButton, PrimaryButton, Separator, Stack, Text } from '@fluentui/react';
import React, { FC, useCallback, useEffect, useState } from 'react';

import { PropertyPaneFieldType, logger } from '@spfx-local-workbench/shared';
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

  return (
    <div
      id="property-pane"
      className={`${styles.panel} ${webPart ? styles.open : ''}`}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        styles={{ root: { padding: '12px 16px', flexShrink: 0 } }}
      >
        <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
          {webPart?.manifest.alias ?? 'Properties'}
        </Text>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          title="Close"
          ariaLabel="Close"
          onClick={onClose}
        />
      </Stack>
      <div id="property-pane-content" style={{ flex: 1, overflowY: 'auto' }}>
        {config && config.pages && config.pages.length > 0 && webPart ? (
          <PropertyPaneContent
            config={config}
            webPart={webPart}
            onPropertyChange={handlePropertyChange}
            getCurrentValue={getCurrentValue}
          />
        ) : (
          <Stack horizontalAlign="center" styles={{ root: { padding: '16px' } }}>
            <Text styles={{ root: { color: '#605e5c' } }}>
              No property pane configuration available for this web part.
            </Text>
          </Stack>
        )}
      </div>
      {isNonReactive && (
        <Stack styles={{ root: { padding: '12px 16px', flexShrink: 0 } }}>
          <PrimaryButton
            text="Apply"
            onClick={handleApply}
            disabled={!hasPendingChanges}
            styles={{ root: { width: 'fit-content' } }}
          />
        </Stack>
      )}
    </div>
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
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: '16px' } }}>
      {page.header?.description && <Text variant="medium">{page.header.description}</Text>}
      {(page.groups || []).map((group: any, groupIndex: number) => (
        <Stack key={groupIndex} tokens={{ childrenGap: 12 }}>
          {!group.isGroupNameHidden && group.groupName && (
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
              {group.groupName}
            </Text>
          )}
          <Stack tokens={{ childrenGap: 8 }}>
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
      return (
        <Text styles={{ root: { color: '#605e5c', fontStyle: 'italic' } }}>
          Dynamic Field Set (Not fully supported)
        </Text>
      );
    default:
      return (
        <Text styles={{ root: { color: '#a80000' } }}>Unsupported field type: {field.type}</Text>
      );
  }
};
