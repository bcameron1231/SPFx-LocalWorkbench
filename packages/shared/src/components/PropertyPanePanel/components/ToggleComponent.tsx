import { Toggle } from '@fluentui/react';
import React, { FC } from 'react';

interface IToggleComponentProps {
  ariaLabel?: string;
  checked: boolean;
  disabled?: boolean;
  inlineLabel?: boolean;
  label?: string;
  offAriaLabel?: string;
  offText: string;
  onAriaLabel?: string;
  onChange: (value: boolean) => void;
  onText: string;
}

export const ToggleComponent: FC<IToggleComponentProps> = ({
  ariaLabel,
  checked,
  disabled,
  inlineLabel,
  label,
  offAriaLabel,
  offText,
  onAriaLabel,
  onChange,
  onText,
}) => (
  <Toggle
    ariaLabel={ariaLabel}
    checked={checked}
    disabled={disabled}
    inlineLabel={inlineLabel}
    label={label}
    offAriaLabel={offAriaLabel}
    offText={inlineLabel ? undefined : offText} // Align with buggy behavior in M365
    onAriaLabel={onAriaLabel}
    onText={inlineLabel ? undefined : onText} // Align with buggy behavior in M365
    onChange={(_, nextChecked) => onChange(!!nextChecked)}
    styles={{
      root: {
        marginBottom: 0, // Override to align with buggy behavior in M365
      },
      label: {
        fontWeight: 400,
        padding: 0,
        margin: 0, // Override to align with buggy behavior in M365
      },
      container: {
        margin: 8,
      },
      pill: {
        marginRight: 4,
      },
    }}
  />
);
