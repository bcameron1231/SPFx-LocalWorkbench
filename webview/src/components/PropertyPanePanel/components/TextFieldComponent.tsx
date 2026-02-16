import { TextField } from '@fluentui/react';
import React, { FC } from 'react';

import { getString } from '../shared';

interface ITextFieldComponentProps {
  field: any;
  value: any;
  onChange: (value: string) => void;
}

export const TextFieldComponent: FC<ITextFieldComponentProps> = ({ field, value, onChange }) => {
  const label = getString(field.properties?.label || field.properties?.Label);
  const description = getString(field.properties?.description || field.properties?.Description);
  const placeholder = getString(field.properties?.placeholder || field.properties?.Placeholder);

  // Fallback: use targetProperty as label if no label provided
  const displayLabel =
    label ||
    (field.targetProperty
      ? field.targetProperty.charAt(0).toUpperCase() + field.targetProperty.slice(1)
      : undefined);

  return (
    <TextField
      label={displayLabel}
      description={description}
      placeholder={placeholder}
      value={value || ''}
      onChange={(_, newValue) => onChange(newValue || '')}
      multiline={field.properties?.multiline}
      rows={field.properties?.rows || 3}
    />
  );
};
