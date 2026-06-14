import { ChoiceGroup, IChoiceGroupOption } from '@fluentui/react';
import React, { FC } from 'react';

interface IChoiceGroupComponentProps {
  label?: string;
  onChange: (value: string | undefined) => void;
  options: IChoiceGroupOption[];
  selectedKey?: string;
}

export const ChoiceGroupComponent: FC<IChoiceGroupComponentProps> = ({
  label,
  onChange,
  options,
  selectedKey,
}) => (
  <ChoiceGroup
    label={label}
    selectedKey={selectedKey}
    options={options}
    onChange={(_, option) => onChange(option?.key)}
  />
);
