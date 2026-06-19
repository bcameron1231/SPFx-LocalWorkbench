import { ChoiceGroup, IChoiceGroupOption } from '@fluentui/react';
import React, { FC } from 'react';

interface IChoiceGroupComponentProps {
  ariaLabel?: string;
  disabled?: boolean;
  label?: string;
  onChange: (value: string | undefined) => void;
  options: IChoiceGroupOption[];
  selectedKey?: string;
}

export const ChoiceGroupComponent: FC<IChoiceGroupComponentProps> = ({
  ariaLabel,
  disabled,
  label,
  onChange,
  options,
  selectedKey,
}) => (
  <ChoiceGroup
    ariaLabel={ariaLabel}
    disabled={disabled}
    label={label}
    selectedKey={selectedKey}
    options={options}
    onChange={(_, option) => onChange(option?.key)}
  />
);
