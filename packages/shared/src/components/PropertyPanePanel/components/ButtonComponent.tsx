import {
  CommandBarButton,
  CompoundButton,
  DefaultButton,
  type IButtonProps,
  IconButton,
  PrimaryButton,
} from '@fluentui/react';
import React, { FC } from 'react';

interface IButtonComponentProps {
  ariaDescription?: string;
  ariaLabel?: string;
  buttonType?: number;
  currentValue: unknown;
  description?: string;
  disabled?: boolean;
  iconProps?: { iconName?: string };
  onChange: (value: unknown) => void;
  onClick?: (value: unknown) => unknown;
  text?: string;
}

export const ButtonComponent: FC<IButtonComponentProps> = ({
  ariaDescription,
  ariaLabel,
  buttonType,
  currentValue,
  description,
  disabled,
  iconProps,
  onChange,
  onClick,
  text,
}) => {
  const baseRootStyle = {
    padding: '0 12px',
    maxHeight: 32,
    borderRadius: 4,
  };

  const buttonProps: IButtonProps = {
    ariaDescription,
    ariaLabel,
    description,
    disabled,
    iconProps,
    onClick: () => {
      const nextValue = onClick?.(currentValue);
      if (nextValue !== undefined) {
        onChange(nextValue);
      }
    },
    text,
    styles: {
      root: baseRootStyle,
    },
  };

  switch (buttonType) {
    // PropertyPaneButtonType.Primary
    case 1:
      return <PrimaryButton {...buttonProps} />;

    // PropertyPaneButtonType.Hero
    case 2:
      return <DefaultButton {...buttonProps} />;

    // PropertyPaneButtonType.Compound
    case 3:
      return (
        <CompoundButton
          {...buttonProps}
          styles={{
            ...buttonProps.styles,
            root: {
              ...baseRootStyle,
              padding: '14px 12px 16px 12px',
            },
            rootDisabled: {
              cursor: 'not-allowed',
            },
            label: {
              lineHeight: 20,
              margin: 0,
            },
          }}
        />
      );

    // PropertyPaneButtonType.Command
    case 4:
      return (
        <CommandBarButton
          {...buttonProps}
          styles={{
            ...buttonProps.styles,
            root: {
              ...baseRootStyle,
              maxHeight: 40,
              height: 40,
              padding: '0 4px',
            },
          }}
        />
      );

    // PropertyPaneButtonType.Icon
    case 5:
      return (
        <IconButton
          {...buttonProps}
          styles={{
            ...buttonProps.styles,
            rootDisabled: {
              backgroundColor: 'transparent',
            },
          }}
        />
      );

    // PropertyPaneButtonType.Normal
    default:
      return <DefaultButton {...buttonProps} />;
  }
};
