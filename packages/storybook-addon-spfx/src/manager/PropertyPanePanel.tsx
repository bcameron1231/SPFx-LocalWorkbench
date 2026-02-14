/**
 * Property Pane panel
 * Shows the SPFx property pane for the active web part
 */

import React, { useState, useEffect } from 'react';
import { useChannel } from '@storybook/manager-api';
import { AddonPanel } from '@storybook/components';
import { EVENTS } from '../constants';

export const PropertyPanePanel: React.FC<{ active: boolean }> = ({ active }) => {
  const [properties, setProperties] = useState<Record<string, any>>({});
  const [propertyPaneConfig, setPropertyPaneConfig] = useState<any>(null);

  const emit = useChannel({
    [EVENTS.PROPERTY_CHANGED]: ({ propertyPath, newValue }: any) => {
      setProperties(prev => ({
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
      <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>
          Property Pane
        </h3>
        {Object.keys(properties).length === 0 ? (
          <p style={{ fontSize: '12px', color: '#666' }}>
            No properties available. The web part will expose its property pane configuration here.
          </p>
        ) : (
          <div style={{ fontSize: '12px' }}>
            {Object.entries(properties).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                  {key}
                </label>
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    fontSize: '12px',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AddonPanel>
  );
};
