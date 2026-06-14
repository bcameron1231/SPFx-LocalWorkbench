import { Slider } from '@fluentui/react';
import React, { FC } from 'react';

interface ISliderComponentProps {
  label?: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}

export const SliderComponent: FC<ISliderComponentProps> = ({
  label,
  max,
  min,
  onChange,
  step,
  value,
}) => (
  <Slider
    label={label}
    min={min}
    max={max}
    step={step}
    value={value}
    showValue
    onChange={(newValue) => onChange(newValue)}
  />
);
