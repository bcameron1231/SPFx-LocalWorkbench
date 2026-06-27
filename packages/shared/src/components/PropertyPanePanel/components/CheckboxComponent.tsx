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
    styles={{
      checkbox: {
        width: 16,
        height: 16,
        margin: 8,
        ...(disabled && { backgroundColor: 'var(--bodyBackground, #ffffff)' }),
      },
      checkmark: {
        fontSize: 10,
        ...(disabled && { color: 'var(--neutralTertiary, #a19f9d)' }),
        ...(!checked && { opacity: '0 !important' }),
      },
      text: {
        padding: 8,
        paddingLeft: 4,
        margin: '-2px 0',
      },
    }}
  />
);
