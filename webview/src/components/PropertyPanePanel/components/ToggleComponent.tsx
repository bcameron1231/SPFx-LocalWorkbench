import { Toggle } from '@fluentui/react';
import React, { FC } from 'react';

import { getString } from '../shared';

interface IToggleComponentProps {
  field: any;
  value: any;
  onChange: (value: boolean) => void;
}

export const ToggleComponent: FC<IToggleComponentProps> = ({ field, value, onChange }) => {
  const label = getString(field.properties?.label || field.properties?.Label);
  const onText = getString(field.properties?.onText || field.properties?.OnText) || 'On';
  const offText = getString(field.properties?.offText || field.properties?.OffText) || 'Off';

  return (
    <Toggle
      label={label}
      checked={!!value}
      onText={onText}
      offText={offText}
      onChange={(_, checked) => onChange(!!checked)}
    />
  );
};
