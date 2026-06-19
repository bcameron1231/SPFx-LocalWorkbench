import { TextField } from '@fluentui/react';
import React, { FC, useEffect, useRef } from 'react';

interface ITextFieldComponentProps {
  ariaLabel?: string;
  autoFocus?: boolean;
  deferredValidationTime?: number;
  description?: string;
  disabled?: boolean;
  errorMessage?: string;
  label?: string;
  maxLength?: number;
  multiline?: boolean;
  onGetErrorMessage?: (value: string) => string | Promise<string>;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  resizable?: boolean;
  rows?: number;
  underlined?: boolean;
  validateOnFocusIn?: boolean;
  validateOnFocusOut?: boolean;
  value: string;
}

export const TextFieldComponent: FC<ITextFieldComponentProps> = ({
  ariaLabel,
  autoFocus,
  deferredValidationTime,
  description,
  disabled,
  errorMessage,
  label,
  maxLength,
  multiline,
  onGetErrorMessage,
  onChange,
  placeholder,
  readOnly,
  resizable,
  rows,
  underlined,
  validateOnFocusIn,
  validateOnFocusOut,
  value,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const inputElement = containerRef.current?.querySelector('input, textarea') as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    inputElement?.focus();
    inputElement?.select?.();
  }, [autoFocus]);

  return (
    <div ref={containerRef} style={{ paddingTop: 4 }}>
      <TextField
        ariaLabel={ariaLabel}
        deferredValidationTime={deferredValidationTime}
        description={description}
        disabled={disabled}
        errorMessage={errorMessage}
        label={label}
        maxLength={maxLength}
        multiline={multiline}
        onChange={(_, newValue) => onChange(newValue || '')}
        onGetErrorMessage={onGetErrorMessage}
        placeholder={placeholder}
        readOnly={readOnly}
        resizable={resizable}
        rows={rows}
        underlined={underlined}
        validateOnFocusIn={validateOnFocusIn}
        validateOnFocusOut={validateOnFocusOut}
        value={value}
        styles={{
          subComponentStyles: {
            label: {
              root: {
                fontWeight: 400,
                paddingLeft: 0, // Fix for underlined
              },
            },
          },
          wrapper: {
            display: 'block', // Fix for underlined
          },
          fieldGroup: {
            borderColor: 'color-mix(in srgb, var(--neutralTertiary) 50%, transparent)',
            ...(readOnly ? {} : { borderBottomColor: 'var(--neutralPrimary)' }),
            position: 'relative',
            borderRadius: 4,
            selectors: {
              ':hover': {
                borderColor: 'color-mix(in srgb, var(--neutralTertiary) 50%, transparent)',
                ...(readOnly ? {} : { borderBottomColor: 'var(--neutralPrimary)' }),
              },
              ':focus-within': {
                borderColor: 'var(--neutralTertiary)',
              },
              '::after': {
                content: '""',
                position: 'absolute',
                left: -1,
                right: -1,
                top: 'auto',
                bottom: -1,
                height: 4,
                border: 'none',
                borderBottom: '2px solid var(--themePrimary)',
                transform: 'scaleX(0)',
                transformOrigin: 'center',
                transition: 'none',
                pointerEvents: 'none',
                borderRadius: 4,
              },
              ':focus-within::after': {
                transform: 'scaleX(1)',
                transitionProperty: 'transform',
                transitionDuration: '200ms',
                transitionDelay: 'cubic-bezier(0, 0, 0, 1)',
              },
            },
          },
          description: {
            fontSize: 12,
            lineHeight: 16,
            display: 'block',
            marginTop: 2,
          },
        }}
      />
    </div>
  );
};
