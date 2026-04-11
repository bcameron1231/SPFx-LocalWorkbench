import { Label } from '@fluentui/react';
import React, { FC } from 'react';

import { getString } from '../shared';

interface ILabelComponentProps {
  field: any;
}

export const LabelComponent: FC<ILabelComponentProps> = ({ field }) => {
  const text = getString(field.properties?.text || field.properties?.Text);
  return <Label>{text}</Label>;
};
