import * as React from 'react';
import { DisplayMode } from '@microsoft/sp-core-library';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './DisplayModeIndicator.module.scss';

export interface IDisplayModeIndicatorProps {
  displayMode: DisplayMode;
}

export const DisplayModeIndicator: React.FC<IDisplayModeIndicatorProps> = ({ displayMode }) => {
  const isEdit = displayMode === DisplayMode.Edit;

  return (
    <div className={styles.container}>
      <Icon iconName={isEdit ? 'Edit' : 'View'} className={styles.icon} />
      <span>{isEdit ? 'Edit mode' : 'Preview mode'}</span>
    </div>
  );
};
