import { Checkbox } from '@fluentui/react';
import React, { FC } from 'react';

interface ICheckboxComponentProps {
  ariaLabel?: string;
  checked: boolean;
  disabled?: boolean;
  label?: string;
  onChange: (value: boolean) => void;
}

export const CheckboxComponent: FC<ICheckboxComponentProps> = ({
  ariaLabel,
  checked,
  disabled,
  label,
  onChange,
}) => (
  <Checkbox
    ariaLabel={ariaLabel}
    checked={checked}
    disabled={disabled}
    label={label}
    onChange={(_, nextChecked) => onChange(!!nextChecked)}
  />
);
