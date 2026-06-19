import { Slider } from '@fluentui/react';
import React, { FC } from 'react';

interface ISliderComponentProps {
  ariaLabel?: string;
  disabled?: boolean;
  label?: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  step: number;
  value: number;
}

export const SliderComponent: FC<ISliderComponentProps> = ({
  ariaLabel,
  disabled,
  label,
  max,
  min,
  onChange,
  showValue,
  step,
  value,
}) => (
  <Slider
    ariaLabel={ariaLabel}
    disabled={disabled}
    label={label}
    min={min}
    max={max}
    step={step}
    value={value}
    showValue={showValue}
    onChange={(newValue) => onChange(newValue)}
  />
);
