import React, { FC, useCallback, useEffect, useRef } from 'react';

import { logger } from '@spfx-local-workbench/shared';

import styles from './CustomFieldComponent.module.css';
import type { IPropertyPaneCustomFieldPropsModel, IPropertyPaneFieldChangeCallback, IPropertyPaneFieldModel } from '../types';

interface ICustomFieldComponentProps {
  field: IPropertyPaneFieldModel<IPropertyPaneCustomFieldPropsModel>;
  onChange: (value: unknown) => void;
  value: unknown;
}

export const CustomFieldComponent: FC<ICustomFieldComponentProps> = ({
  field,
  value,
  onChange,
}) => {
  const { context, key, onDispose, onRender } = field.properties;
  const containerRef = useRef<HTMLDivElement>(null);

  const changeCallback = useCallback<IPropertyPaneFieldChangeCallback>(
    (targetProperty, newValue, isValidEntry) => {
      if (isValidEntry === false) {
        return;
      }

      if (targetProperty && targetProperty !== field.targetProperty) {
        return;
      }

      onChange(newValue);
    },
    [field.targetProperty, onChange],
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
  }, [changeCallback, context, onDispose, onRender, value]);

  if (typeof onRender !== 'function') {
    return (
      <div className="pp-field">
        <div className={styles.customFieldFallback}>Custom Field {key}</div>
      </div>
    );
  }

  return <div className="pp-field" ref={containerRef}></div>;
};
