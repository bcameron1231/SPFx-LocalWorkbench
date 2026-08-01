import React, { FC, useCallback, useEffect, useRef } from 'react';

import { logger } from '../../../utils';
import type {
  IPropertyPaneCustomFieldPropsModel,
  IPropertyPaneFieldModel,
  PropertyPaneFieldChangeCallback,
} from '../types';
import styles from './CustomFieldComponent.module.css';

interface ICustomFieldComponentProps {
  field: IPropertyPaneFieldModel<IPropertyPaneCustomFieldPropsModel>;
  onFieldValidityChange: (targetProperty: string, isValid: boolean) => void;
  onPropertyChange: (targetProperty: string, value: unknown) => void;
  value: unknown;
}

export const CustomFieldComponent: FC<ICustomFieldComponentProps> = ({
  field,
  onFieldValidityChange,
  onPropertyChange,
}) => {
  const { context, key, onDispose, onRender } = field.properties;
  const containerRef = useRef<HTMLDivElement>(null);
  const targetPropertyRef = useRef(field.targetProperty);
  const onFieldValidityChangeRef = useRef(onFieldValidityChange);
  const onPropertyChangeRef = useRef(onPropertyChange);

  useEffect(() => {
    targetPropertyRef.current = field.targetProperty;
    onFieldValidityChangeRef.current = onFieldValidityChange;
    onPropertyChangeRef.current = onPropertyChange;
  }, [field.targetProperty, onFieldValidityChange, onPropertyChange]);

  const changeCallback = useCallback<PropertyPaneFieldChangeCallback>(
    (targetProperty, newValue, isValidEntry) => {
      const resolvedTargetProperty = targetProperty || targetPropertyRef.current;

      if (typeof isValidEntry === 'boolean') {
        onFieldValidityChangeRef.current(resolvedTargetProperty, isValidEntry);
      }

      if (isValidEntry === false) {
        return;
      }

      onPropertyChangeRef.current(resolvedTargetProperty, newValue);
    },
    [],
  );

  useEffect(() => {
    const containerElement = containerRef.current;

    if (typeof onRender === 'function' && containerElement) {
      try {
        onRender(containerElement, context, changeCallback);
      } catch (error: unknown) {
        logger.warn('Custom field render error:', error);
      }
    }

    return () => {
      if (containerElement && onDispose) {
        try {
          onDispose(containerElement, context);
        } catch (error: unknown) {
          logger.warn('Custom field dispose error:', error);
        }
      }
    };
  }, [changeCallback, key]);

  if (typeof onRender !== 'function') {
    return (
      <div className="pp-field">
        <div className={styles.customFieldFallback}>Custom Field {key}</div>
      </div>
    );
  }

  return <div className="pp-field" ref={containerRef}></div>;
};
