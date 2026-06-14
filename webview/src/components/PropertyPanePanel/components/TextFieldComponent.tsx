import { TextField } from '@fluentui/react';
import React, { FC } from 'react';

interface ITextFieldComponentProps {
  description?: string;
  label?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}

export const TextFieldComponent: FC<ITextFieldComponentProps> = ({
  description,
  label,
  multiline,
  onChange,
  placeholder,
  rows,
  value,
}) => {
  return (
    <TextField
      label={label}
      description={description}
      placeholder={placeholder}
      value={value}
      onChange={(_, newValue) => onChange(newValue || '')}
      multiline={multiline}
      rows={rows}
    />
  );
};
