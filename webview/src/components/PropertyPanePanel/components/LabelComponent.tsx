import { Label } from '@fluentui/react';
import React, { FC } from 'react';

interface ILabelComponentProps {
  required?: boolean;
  text?: string;
}

export const LabelComponent: FC<ILabelComponentProps> = ({ required, text }) => (
  <Label required={required}>{text}</Label>
);
