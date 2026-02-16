import { Dropdown, IDropdownOption } from '@fluentui/react';
import React, { FC } from 'react';

import { getString } from '../shared';

interface IDropdownComponentProps {
  field: any;
  value: any;
  onChange: (value: any) => void;
}

export const DropdownComponent: FC<IDropdownComponentProps> = ({ field, value, onChange }) => {
  const label = getString(field.properties?.label || field.properties?.Label);
  const options = (field.properties?.options || field.properties?.Options || []).map(
    (opt: any) => ({
      key: opt.key,
      text: getString(opt.text) || opt.text,
    }),
  ) as IDropdownOption[];

  return (
    <Dropdown
      label={label}
      selectedKey={value}
      options={options}
      onChange={(_, option) => onChange(option?.key)}
    />
  );
};
