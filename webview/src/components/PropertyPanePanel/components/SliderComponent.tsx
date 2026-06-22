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
}) => {
  const stepsPercent = step !== 1 && step !== 0 ? (step / (max - min)) * 100 : undefined;
  return (
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
      styles={{
        titleLabel: {
          fontWeight: 400,
          color: 'var(--neutralPrimary)',
        },
        activeSection: {
          ...(disabled
            ? {
                backgroundColor: 'var(--neutralTertiary)',
              }
            : {
                backgroundColor: 'var(--themePrimary)',
              }),
        },
        thumb: {
          ...(disabled
            ? {
                backgroundColor: 'var(--neutralTertiary)',
                borderColor: 'var(--neutralTertiary)',
              }
            : {
                backgroundColor: 'var(--themePrimary)',
                borderColor:
                  'color-mix(in srgb, var(--neutralTertiary) 50%, var(--primaryBackground))',
              }),
          borderWidth: 1,
          borderRadius: 10000,
          width: 21,
          height: 21,
          top: -8,
          zIndex: 100,
          boxShadow:
            '0 0 0 4px color-mix(in srgb, var(--neutralLighter) 50%, var(--primaryBackground)) inset',
        },
        inactiveSection: {
          ...(disabled
            ? {
                backgroundColor: 'var(--neutralLight)',
              }
            : {
                backgroundColor: 'var(--neutralSecondary)',
              }),
          overflow: 'hidden',
          selectors: {
            '::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: -1,
              bottom: 0,
              backgroundImage: stepsPercent
                ? `repeating-linear-gradient(
                    90deg,
                    transparent 0,
                    transparent calc(${stepsPercent}% - 1px),
                    var(--primaryBackground) calc(${stepsPercent}% - 1px),
                    var(--primaryBackground) ${stepsPercent}%
                  )`
                : undefined,
              pointerEvents: 'none',
            },
          },
        },
        valueLabel: {
          fontWeight: 400,
          color: 'var(--neutralPrimary)',
        },
      }}
    />
  );
};
