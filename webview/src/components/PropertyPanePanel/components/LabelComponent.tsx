import { Label } from '@fluentui/react';
import React, { FC } from 'react';

interface ILabelComponentProps {
  text?: string;
}

export const LabelComponent: FC<ILabelComponentProps> = ({ text }) => <Label>{text}</Label>;
