/**
 * Break Out panel
 * Allows viewing the component in isolation
 */

import React from 'react';
import { AddonPanel } from '@storybook/components';
import styles from './BreakOutPanel.module.css';

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
      <div className={styles.container}>
        <h3 className={styles.heading}>
          Break Out Component
        </h3>
        <p className={styles.description}>
          View this component in a separate window for isolated testing.
        </p>
        <button
          onClick={handleBreakOut}
          className={styles.button}
        >
          Open in New Window
        </button>
      </div>
    </AddonPanel>
  );
};
