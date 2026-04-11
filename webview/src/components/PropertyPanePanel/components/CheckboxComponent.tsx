import { Checkbox } from '@fluentui/react';
import React, { FC } from 'react';

import { getString } from '../shared';

interface ICheckboxComponentProps {
  field: any;
  value: any;
  onChange: (value: boolean) => void;
}

export const CheckboxComponent: FC<ICheckboxComponentProps> = ({ field, value, onChange }) => {
  const text = getString(field.properties?.text || field.properties?.Text);

  return <Checkbox label={text} checked={!!value} onChange={(_, checked) => onChange(!!checked)} />;
};
