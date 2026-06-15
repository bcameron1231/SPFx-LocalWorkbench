import { TextField } from '@fluentui/react';
import * as React from 'react';

export interface ICustomValidationFieldProps {
  description: string;
  initialValue: string;
  onValueChange: (value: string, isValid: boolean) => void;
}

const isValidValue = (value: string): boolean => {
  return value.trim().length >= 3;
};

export default function CustomValidationField(
  props: ICustomValidationFieldProps,
): React.ReactElement<ICustomValidationFieldProps> {
  const { description, initialValue, onValueChange } = props;
  const [value, setValue] = React.useState(initialValue);

  const isValid = isValidValue(value);

  const handleChange = React.useCallback(
    (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, nextValue?: string) => {
      const updatedValue = nextValue ?? '';
      setValue(updatedValue);
      onValueChange(updatedValue, isValidValue(updatedValue));
    },
    [onValueChange],
  );

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ color: '#605e5c', fontSize: 12 }}>{description}</div>
      <TextField value={value} placeholder="Custom field value" onChange={handleChange} />
      <div style={{ color: isValid ? '#107c10' : '#a4262c', fontSize: 12 }}>
        {isValid ? 'Valid entry' : 'Enter at least 3 characters'}
      </div>
    </div>
  );
}
