/**
 * StatusBarLayoutToggle Component
 *
 * Switches the canvas between the free layout and the SharePoint page layout (sections and columns).
 * Mounted as a separate React root on the static status bar element.
 * Dispatches `workbenchCanvasLayoutToggled`; listens for `workbenchCanvasLayoutChanged` to stay in
 * sync when the VS Code setting changes.
 */
import { css } from '@fluentui/react';
import * as React from 'react';
import { useEffect, useState } from 'react';

import type { CanvasLayoutMode } from '../../types';
import styles from './StatusBarLayoutToggle.module.css';

export interface IStatusBarLayoutToggleProps {
  initialLayout: CanvasLayoutMode;
}

export const StatusBarLayoutToggle: React.FC<IStatusBarLayoutToggleProps> = ({ initialLayout }) => {
  const [layout, setLayout] = useState<CanvasLayoutMode>(initialLayout);

  useEffect(() => {
    const onChanged = (e: Event) => setLayout((e as CustomEvent<CanvasLayoutMode>).detail);
    window.addEventListener('workbenchCanvasLayoutChanged', onChanged);
    return () => window.removeEventListener('workbenchCanvasLayoutChanged', onChanged);
  }, []);

  const isSharePoint = layout === 'sharepoint';

  return (
    <button
      className={styles.trigger}
      role="switch"
      aria-checked={isSharePoint}
      title={
        isSharePoint
          ? 'SharePoint page layout is on: sections and columns as on a SharePoint page. Click to turn it off.'
          : 'SharePoint page layout is off. Click to show sections and columns as on a SharePoint page.'
      }
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent('workbenchCanvasLayoutToggled', {
            detail: isSharePoint ? 'free' : 'sharepoint',
          }),
        )
      }
    >
      <span className={css(styles.indicator, isSharePoint && styles.on)} />
      SharePoint layout
    </button>
  );
};
