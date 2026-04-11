import { Slider } from '@fluentui/react';
import React, { FC } from 'react';

import { getString } from '../shared';

interface ISliderComponentProps {
  field: any;
  value: any;
  onChange: (value: number) => void;
}

export const SliderComponent: FC<ISliderComponentProps> = ({ field, value, onChange }) => {
  const label = getString(field.properties?.label || field.properties?.Label);
  const min = field.properties?.min ?? field.properties?.Min ?? 0;
  const max = field.properties?.max ?? field.properties?.Max ?? 100;
  const step = field.properties?.step ?? field.properties?.Step ?? 1;

  return (
    <Slider
      label={label}
      min={min}
      max={max}
      step={step}
      value={value !== undefined ? value : min}
      showValue
      onChange={(newValue) => onChange(newValue)}
    />
  );
};
