import React, { FC, useEffect, useRef } from 'react';

import { logger } from '@spfx-local-workbench/shared';

import styles from './CustomFieldComponent.module.css';

interface ICustomFieldComponentProps {
  field: any;
  value: any;
  onChange: (value: any) => void;
}

export const CustomFieldComponent: FC<ICustomFieldComponentProps> = ({
  field,
  value,
  onChange,
}) => {
  // Custom fields can render their own content
  if (field.properties.onRender && typeof field.properties.onRender === 'function') {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (containerRef.current) {
        try {
          field.properties.onRender(containerRef.current, value, onChange);
        } catch (error: unknown) {
          logger.warn('Custom field render error:', error);
        }
      }
    }, [field, value, onChange]);

    return <div className="pp-field" ref={containerRef}></div>;
  }

  // Fallback for custom fields without onRender
  return (
    <div className="pp-field">
      <div className={styles.customFieldFallback}>Custom Field {field.properties.key || ''}</div>
    </div>
  );
};
