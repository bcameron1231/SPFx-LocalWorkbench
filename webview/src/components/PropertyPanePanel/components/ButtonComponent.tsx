import { DefaultButton, PrimaryButton, type IButtonProps } from '@fluentui/react';
import React, { FC } from 'react';

interface IButtonComponentProps {
  ariaDescription?: string;
  ariaLabel?: string;
  buttonType?: number;
  currentValue: unknown;
  disabled?: boolean;
  onChange: (value: unknown) => void;
  onClick?: (value: unknown) => unknown;
  text?: string;
}

export const ButtonComponent: FC<IButtonComponentProps> = ({
  ariaDescription,
  ariaLabel,
  buttonType,
  currentValue,
  disabled,
  onChange,
  onClick,
  text,
}) => {
  const buttonProps: IButtonProps = {
    ariaDescription,
    ariaLabel,
    disabled,
    onClick: () => {
      const nextValue = onClick?.(currentValue);
      if (nextValue !== undefined) {
        onChange(nextValue);
      }
    },
    text,
  };

  return buttonType === 1 ? <PrimaryButton {...buttonProps} /> : <DefaultButton {...buttonProps} />;
};
