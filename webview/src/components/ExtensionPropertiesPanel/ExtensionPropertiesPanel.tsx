import {
  IconButton,
  PrimaryButton,
  Separator,
  Stack,
  Text,
  TextField,
  Toggle,
} from '@fluentui/react';
import React, { FC, useEffect, useState } from 'react';

import type { IExtensionConfig } from '../../types';
import styles from './ExtensionPropertiesPanel.module.css';

interface IExtensionPropertiesPanelProps {
  extension?: IExtensionConfig;
  onClose: () => void;
  onPropertyChange: (instanceId: string, properties: Record<string, any>) => void;
}

export const ExtensionPropertiesPanel: FC<IExtensionPropertiesPanelProps> = ({
  extension,
  onClose,
  onPropertyChange,
}) => {
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});

  // Sync edited properties when extension changes
  useEffect(() => {
    if (extension) {
      setEditedProperties({ ...extension.properties });
    } else {
      setEditedProperties({});
    }
  }, [extension]);

  const handleFieldChange = (key: string, value: any) => {
    const updated = { ...editedProperties, [key]: value };
    setEditedProperties(updated);
  };

  const handleApply = () => {
    if (extension) {
      onPropertyChange(extension.instanceId, editedProperties);
    }
  };

  const title =
    extension?.manifest.preconfiguredEntries?.[0]?.title?.default ||
    extension?.manifest.alias ||
    'Extension';

  return (
    <div className={`${styles.panel} ${extension ? styles.open : ''}`}>
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        styles={{ root: { padding: '12px 16px', borderBottom: '1px solid #edebe9' } }}
      >
        <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
          {title} Properties
        </Text>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          title="Close"
          ariaLabel="Close"
          onClick={onClose}
        />
      </Stack>
      <div className={styles.content}>
        {extension ? (
          <Stack tokens={{ childrenGap: 16 }}>
            <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
              Edit the ClientSideComponentProperties for this extension. Click Apply to re-render
              with updated values.
            </Text>
            <Separator />
            {Object.keys(editedProperties).length > 0 ? (
              Object.entries(editedProperties).map(([key, value]) => (
                <PropertyField
                  key={key}
                  name={key}
                  value={value}
                  onChange={(newValue) => handleFieldChange(key, newValue)}
                />
              ))
            ) : (
              <Text styles={{ root: { color: '#605e5c', fontStyle: 'italic' } }}>
                This extension has no preconfigured properties. You can add properties by defining
                them in the manifest's preconfiguredEntries.
              </Text>
            )}
            <Separator />
            <PrimaryButton
              text="Apply"
              onClick={handleApply}
              styles={{ root: { alignSelf: 'flex-start' } }}
            />
          </Stack>
        ) : (
          <Stack horizontalAlign="center" styles={{ root: { padding: '16px' } }}>
            <Text styles={{ root: { color: '#605e5c' } }}>
              Select an extension to edit its properties.
            </Text>
          </Stack>
        )}
      </div>
    </div>
  );
};

interface IPropertyFieldProps {
  name: string;
  value: any;
  onChange: (newValue: any) => void;
}

const PropertyField: FC<IPropertyFieldProps> = ({ name, value, onChange }) => {
  const valueType = typeof value;

  if (valueType === 'boolean') {
    return <Toggle label={name} checked={value} onChange={(_, checked) => onChange(!!checked)} />;
  }

  if (valueType === 'number') {
    return (
      <TextField
        label={name}
        value={String(value)}
        type="number"
        onChange={(_, newValue) => {
          const num = Number(newValue);
          onChange(isNaN(num) ? 0 : num);
        }}
      />
    );
  }

  if (valueType === 'object' && value !== null) {
    // Show JSON editor for objects/arrays
    const [jsonText, setJsonText] = useState(JSON.stringify(value, null, 2));
    const [jsonError, setJsonError] = useState('');

    return (
      <Stack tokens={{ childrenGap: 4 }}>
        <TextField
          label={name}
          multiline
          rows={4}
          value={jsonText}
          onChange={(_, newValue) => {
            setJsonText(newValue || '');
            try {
              const parsed = JSON.parse(newValue || '{}');
              setJsonError('');
              onChange(parsed);
            } catch {
              setJsonError('Invalid JSON');
            }
          }}
        />
        {jsonError && (
          <Text variant="small" styles={{ root: { color: '#a80000' } }}>
            {jsonError}
          </Text>
        )}
      </Stack>
    );
  }

  // Default: string
  return (
    <TextField
      label={name}
      value={value != null ? String(value) : ''}
      onChange={(_, newValue) => onChange(newValue || '')}
    />
  );
};
