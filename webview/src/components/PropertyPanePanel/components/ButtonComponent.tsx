import { PrimaryButton } from '@fluentui/react';
import React, { FC } from 'react';

interface IButtonComponentProps {
  onClick?: (value: unknown) => unknown;
  text?: string;
}

export const ButtonComponent: FC<IButtonComponentProps> = ({ onClick, text }) => (
  <PrimaryButton text={text} onClick={() => onClick?.(undefined)} />
);
