/**
 * Property Pane panel
 * Shows the SPFx property pane for the active web part
 */
import { AddonPanel } from '@storybook/components';
import { useChannel } from '@storybook/manager-api';
import React, { useState } from 'react';

import { EVENTS } from '../constants';
import styles from './PropertyPanePanel.module.css';

export const PropertyPanePanel: React.FC<{ active: boolean }> = ({ active }) => {
  const [properties, setProperties] = useState<Record<string, any>>({});

  const emit = useChannel({
    [EVENTS.PROPERTY_CHANGED]: ({ propertyPath, newValue }: any) => {
      setProperties((prev) => ({
        ...prev,
        [propertyPath]: newValue,
      }));
    },
  });

  const handlePropertyChange = (propertyPath: string, value: any) => {
    const newProperties = {
      ...properties,
      [propertyPath]: value,
    };
    setProperties(newProperties);
    emit(EVENTS.UPDATE_PROPERTIES, newProperties);
  };

  if (!active) {
    return null;
  }

  return (
    <AddonPanel active={active}>
      <div className={styles.container}>
        <h3 className={styles.heading}>Property Pane</h3>
        {Object.keys(properties).length === 0 ? (
          <p className={styles.emptyMessage}>
            No properties available. The web part will expose its property pane configuration here.
          </p>
        ) : (
          <div className={styles.propertiesContainer}>
            {Object.entries(properties).map(([key, value]) => (
              <div key={key} className={styles.propertyItem}>
                <label className={styles.propertyLabel}>{key}</label>
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                  className={styles.propertyInput}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AddonPanel>
  );
};
