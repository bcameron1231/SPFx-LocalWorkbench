import { Icon, TextField } from '@fluentui/react';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

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
  onFieldValidityChange?: (isValid: boolean) => void;
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
  onFieldValidityChange,
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
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const validationRequestIdRef = useRef(0);
  const [draftValue, setDraftValue] = useState(value);
  const [validationErrorMessage, setValidationErrorMessage] = useState<string | undefined>();
  const effectiveErrorMessage = validationErrorMessage ?? errorMessage;

  const runValidation = useCallback(
    async (nextValue: string) => {
      if (!onGetErrorMessage) {
        setValidationErrorMessage(undefined);
        onFieldValidityChange?.(true);
        onChange(nextValue);
        return;
      }

      const requestId = ++validationRequestIdRef.current;
      const result = await onGetErrorMessage(nextValue);

      if (requestId !== validationRequestIdRef.current) {
        return;
      }

      const nextErrorMessage = typeof result === 'string' ? result : '';
      const isValid = nextErrorMessage.length === 0;

      setValidationErrorMessage(nextErrorMessage || undefined);
      onFieldValidityChange?.(isValid);

      if (isValid) {
        onChange(nextValue);
      }
    },
    [onChange, onFieldValidityChange, onGetErrorMessage],
  );

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

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const handleValueChange = useCallback(
    (nextValue: string) => {
      setDraftValue(nextValue);

      if (!onGetErrorMessage) {
        onChange(nextValue);
        return;
      }

      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      if (deferredValidationTime && deferredValidationTime > 0) {
        validationTimeoutRef.current = setTimeout(() => {
          void runValidation(nextValue);
        }, deferredValidationTime);
        return;
      }

      void runValidation(nextValue);
    },
    [deferredValidationTime, onChange, onGetErrorMessage, runValidation],
  );

  return (
    <div ref={containerRef} style={{ paddingTop: 4 }}>
      <TextField
        ariaLabel={ariaLabel}
        deferredValidationTime={deferredValidationTime}
        disabled={disabled}
        label={label}
        maxLength={maxLength}
        multiline={multiline}
        onBlur={
          validateOnFocusOut
            ? () => {
                void runValidation(draftValue);
              }
            : undefined
        }
        onChange={(_, newValue) => handleValueChange(newValue || '')}
        onFocus={
          validateOnFocusIn
            ? () => {
                void runValidation(draftValue);
              }
            : undefined
        }
        onGetErrorMessage={onGetErrorMessage}
        placeholder={placeholder}
        readOnly={readOnly}
        resizable={resizable}
        rows={rows}
        underlined={underlined}
        validateOnFocusIn={validateOnFocusIn}
        validateOnFocusOut={validateOnFocusOut}
        value={draftValue}
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
          errorMessage: {
            display: 'none',
          },
        }}
      />
      {effectiveErrorMessage && (
        <div
          style={{
            alignItems: 'flex-start',
            color: 'var(--errorText, #d13438)',
            display: 'flex',
            fontSize: 12,
            lineHeight: '16px',
            gap: 4,
            marginTop: 2,
          }}
        >
          <Icon iconName="AlertSolid" style={{ fontSize: 12, lineHeight: '16px', marginTop: 1 }} />
          <span>{effectiveErrorMessage}</span>
        </div>
      )}
      {description && (
        <div
          style={{
            color: 'var(--neutralSecondary, #605e5c)',
            fontSize: 12,
            lineHeight: '16px',
            marginTop: 2,
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
};
