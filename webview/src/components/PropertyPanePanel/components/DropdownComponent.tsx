import { Dropdown, IDropdownOption } from '@fluentui/react';
import React, { FC } from 'react';

interface IDropdownComponentProps {
  ariaLabel?: string;
  calloutMaxHeight?: number;
  disabled?: boolean;
  label?: string;
  onChange: (value: string | number | undefined) => void;
  options: IDropdownOption[];
  selectedKey?: string | number;
}

export const DropdownComponent: FC<IDropdownComponentProps> = ({
  ariaLabel,
  calloutMaxHeight,
  disabled,
  label,
  onChange,
  options,
  selectedKey,
}) => (
  <Dropdown
    ariaLabel={ariaLabel}
    calloutProps={calloutMaxHeight ? { calloutMaxHeight } : undefined}
    disabled={disabled}
    label={label}
    selectedKey={selectedKey}
    options={options}
    onChange={(_, option) => onChange(option?.key)}
  />
);
