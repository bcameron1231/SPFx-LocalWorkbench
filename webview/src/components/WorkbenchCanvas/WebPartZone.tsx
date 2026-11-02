import { IconButton } from '@fluentui/react';
import React, { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { IWebPartConfig } from '@spfx-local-workbench/shared';

import { getWebPartHost } from '../../canvas/webPartHosts';
import styles from './WorkbenchCanvas.module.css';

export interface IWebPartZoneProps {
  webPart: IWebPartConfig;
  onEdit: () => void;
  onDelete: () => void;
  /** 'sharepoint': toolbar and name chip placed like on a SharePoint page in edit mode */
  variant?: 'free' | 'sharepoint';
  /** Shown in the name chip (SharePoint mode) */
  title?: string;
}

export const WebPartZone: FC<IWebPartZoneProps> = ({
  webPart,
  onEdit,
  onDelete,
  variant = 'free',
  title,
}) => {
  // SharePoint marks the web part the user clicked as selected (ControlZone--selected). Web parts
  // style their edit-mode UI (e.g. floating action bars) against these classes.
  const zoneRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [isSelected, setIsSelected] = useState(false);

  // The web part renders into an element that outlives this zone (see webPartHosts), so moving a web
  // part to another column keeps what it rendered
  useLayoutEffect(() => {
    const host = getWebPartHost(
      webPart.instanceId,
      variant === 'sharepoint'
        ? `${styles.webPartContent} ${styles.spWebPartContent}`
        : styles.webPartContent,
    );
    slotRef.current?.appendChild(host);
  }, [webPart.instanceId, variant]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const inside = !!target && !!zoneRef.current?.contains(target);
      // Clicks in the property pane or in popups (rendered outside the zone) keep the selection
      const inPane =
        target instanceof Element && !!target.closest('[class*="propertyPane" i], .ms-Layer');
      if (inside) {
        setIsSelected(true);
      } else if (!inPane) {
        setIsSelected(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  const isSharePoint = variant === 'sharepoint';
  const zoneClassName = [
    styles.webPartZone,
    isSharePoint ? styles.spWebPartZone : '',
    'ControlZone',
    isSelected ? 'ControlZone--selected' : '',
    isSelected && isSharePoint ? styles.spSelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  const edit = () => {
    setIsSelected(true);
    onEdit();
  };

  return (
    // As on SharePoint, the 16px padding is on the CanvasControl around the web part's element: web parts
    // position floating UI from it (e.g. our ActionsMenu: 40px + this padding above the web part)
    <div
      ref={zoneRef}
      className={zoneClassName}
      data-automation-id={isSharePoint ? 'CanvasControl' : undefined}
    >
      {isSharePoint ? (
        <>
          {title && <div className={styles.spNameChip}>{title}</div>}
          <div className={styles.spWebPartToolbar} role="toolbar" aria-label="Web part toolbar">
            <IconButton
              iconProps={{ iconName: 'Edit' }}
              title="Edit properties"
              ariaLabel="Edit properties"
              onClick={edit}
            />
            <IconButton
              iconProps={{ iconName: 'Delete' }}
              title="Delete web part"
              ariaLabel="Delete web part"
              onClick={onDelete}
            />
          </div>
        </>
      ) : (
        <div className={styles.webPartToolbar}>
          <IconButton
            iconProps={{ iconName: 'Edit' }}
            title="Edit properties"
            ariaLabel="Edit properties"
            onClick={edit}
          />
          <IconButton
            iconProps={{ iconName: 'Delete' }}
            title="Delete"
            ariaLabel="Delete web part"
            onClick={onDelete}
          />
        </div>
      )}
      <div className={isSharePoint ? styles.spWebPartContainer : styles.webPartContainer}>
        <div ref={slotRef} />
      </div>
    </div>
  );
};
