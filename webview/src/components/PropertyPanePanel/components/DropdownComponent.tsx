import { Dropdown, IDropdownOption } from '@fluentui/react';
import React, { FC } from 'react';

interface IDropdownComponentProps {
  label?: string;
  onChange: (value: string | number | undefined) => void;
  options: IDropdownOption[];
  selectedKey?: string | number;
}

export const DropdownComponent: FC<IDropdownComponentProps> = ({
  label,
  onChange,
  options,
  selectedKey,
}) => (
  <Dropdown
    label={label}
    selectedKey={selectedKey}
    options={options}
    onChange={(_, option) => onChange(option?.key)}
  />
);
