import { Checkbox } from '@fluentui/react';
import React, { FC } from 'react';

interface ICheckboxComponentProps {
  checked: boolean;
  label?: string;
  onChange: (value: boolean) => void;
}

export const CheckboxComponent: FC<ICheckboxComponentProps> = ({ checked, label, onChange }) => (
  <Checkbox label={label} checked={checked} onChange={(_, nextChecked) => onChange(!!nextChecked)} />
);
