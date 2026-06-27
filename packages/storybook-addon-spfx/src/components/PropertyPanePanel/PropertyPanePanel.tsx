/**
 * Property Pane panel
 * Shows the SPFx property pane for the active web part
 */
import { AddonPanel } from '@storybook/components';
import { useChannel } from '@storybook/manager-api';
import React, { useEffect } from 'react';

import { EVENTS } from '../../constants';
import styles from './PropertyPanePanel.module.css';

export const PropertyPanePanel: React.FC<{ active: boolean }> = ({ active }) => {
  const emit = useChannel({});

  useEffect(() => {
    emit(EVENTS.PROPERTY_PANE_VISIBILITY_CHANGED, { isOpen: active });
  }, [active, emit]);

  if (!active) {
    return null;
  }

  return (
    <AddonPanel active={active}>
      <div className={styles.container}>
        <h3 className={styles.heading}>Property Pane</h3>
        <p className={styles.emptyMessage}>
          The live property pane now opens inside the Storybook preview so it can use the real
          SPFx web part instance, field callbacks, and non-reactive apply flow.
        </p>
        <p className={styles.emptyMessage}>
          Keep this tab selected to show the pane, or close the preview-side pane with its header
          close button when you want more canvas space.
        </p>
      </div>
    </AddonPanel>
  );
};
