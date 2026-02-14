/**
 * Break Out panel
 * Allows viewing the component in isolation
 */

import React from 'react';
import { AddonPanel } from '@storybook/components';

export const BreakOutPanel: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) {
    return null;
  }

  const handleBreakOut = () => {
    // Open the current story in a new window
    const currentUrl = window.location.href;
    const viewMode = currentUrl.includes('viewMode=story') ? 'story' : 'docs';
    const breakOutUrl = currentUrl.replace(/viewMode=(story|docs)/, `viewMode=${viewMode}`);
    window.open(breakOutUrl, '_blank');
  };

  return (
    <AddonPanel active={active}>
      <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>
          Break Out Component
        </h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
          View this component in a separate window for isolated testing.
        </p>
        <button
          onClick={handleBreakOut}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Open in New Window
        </button>
      </div>
    </AddonPanel>
  );
};
