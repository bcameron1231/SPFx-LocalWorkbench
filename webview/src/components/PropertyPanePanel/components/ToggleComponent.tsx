import { Toggle } from '@fluentui/react';
import React, { FC } from 'react';

interface IToggleComponentProps {
  checked: boolean;
  label?: string;
  onChange: (value: boolean) => void;
  offText: string;
  onText: string;
}

export const ToggleComponent: FC<IToggleComponentProps> = ({
  checked,
  label,
  offText,
  onChange,
  onText,
}) => (
  <Toggle
    label={label}
    checked={checked}
    onText={onText}
    offText={offText}
    onChange={(_, nextChecked) => onChange(!!nextChecked)}
  />
);
