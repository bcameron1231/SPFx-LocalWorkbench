import { IconButton, Link, PrimaryButton, Stack, Text } from '@fluentui/react';
import React, { FC, Fragment, useEffect, useMemo, useState } from 'react';

import type {
  IComponentManifest,
  IWebPartConfig,
  IWebPartManifest,
} from '@spfx-local-workbench/shared';

import { getLocalizedString } from '../../utilities';
import { ComponentPicker, IComponentItem } from '../ComponentPicker';
//import { WebPartPicker } from '../WebPartPicker';
import styles from './WorkbenchCanvas.module.css';

interface IWorkbenchCanvasProps {
  manifests: IComponentManifest[];
  activeWebParts: IWebPartConfig[];
  onAddWebPart: (
    insertIndex: number,
    manifestIndex: number,
    preconfiguredEntryIndex?: number,
  ) => void;
  onEditWebPart: (index: number) => void;
  onDeleteWebPart: (index: number) => void;
  locale?: string;
}

export const WorkbenchCanvas: FC<IWorkbenchCanvasProps> = ({
  manifests,
  activeWebParts,
  onAddWebPart,
  onEditWebPart,
  onDeleteWebPart,
  locale,
}) => {
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  const [serveClicked, setServeClicked] = useState(false);

  const handleAddClick = (insertIndex: number) => {
    setOpenPickerIndex(openPickerIndex === insertIndex ? null : insertIndex);
  };

  const handlePickerSelect = (
    manifestIndex: number,
    insertIndex: number = 0,
    preconfiguredEntryIndex?: number,
  ) => {
    setOpenPickerIndex(null);
    onAddWebPart(insertIndex, manifestIndex, preconfiguredEntryIndex);
  };

  const handleOverlayClick = () => {
    setOpenPickerIndex(null);
  };

  const handleStartServe = () => {
    setServeClicked(true);
    window.dispatchEvent(new CustomEvent('startServe'));
  };

  // Re-enable the Serve button after a timeout so the user can retry if the
  // serve command fails. On success the manifests will load and this empty
  // state unmounts entirely, so the reset is only relevant on failure.
  useEffect(() => {
    if (!serveClicked) {
      return;
    }
    const timer = setTimeout(() => setServeClicked(false), 30_000);
    return () => clearTimeout(timer);
  }, [serveClicked]);

  const handleOpenSettings = () => {
    window.dispatchEvent(new CustomEvent('openSettings'));
  };

  if (manifests.length === 0) {
    const serveCommand = window.__workbenchConfig?.serveCommand || 'heft start --clean --nobrowser';

    return (
      <div id="canvas">
        <Stack
          horizontalAlign="center"
          tokens={{ childrenGap: 16 }}
          styles={{ root: { padding: '24px' } }}
        >
          <Text
            variant="large"
            styles={{ root: { color: '#a80000', marginBottom: 16, textAlign: 'center' } }}
          >
            No SPFx components found. Make sure your project is served / running.
          </Text>
          <PrimaryButton
            text="Serve"
            onClick={handleStartServe}
            disabled={serveClicked}
            iconProps={serveClicked ? { iconName: 'Sync' } : undefined}
            styles={
              serveClicked
                ? {
                    icon: {
                      animation: 'spin 1.5s linear infinite',
                    },
                  }
                : undefined
            }
          />
          <Stack
            horizontal
            tokens={{ childrenGap: 4 }}
            styles={{ root: { alignItems: 'flex-end' } }}
          >
            <Text variant="small" styles={{ root: { color: '#605e5c', marginRight: 4 } }}>
              Command:
            </Text>
            <Text variant="small" styles={{ root: { fontFamily: 'monospace', color: '#323130' } }}>
              {serveCommand}
            </Text>
          </Stack>
          <Link onClick={handleOpenSettings} styles={{ root: { fontSize: 12 } }}>
            Open Extension Settings
          </Link>
        </Stack>
      </div>
    );
  }

  return (
    <>
      <div id="canvas">
        {/* First add zone */}
        <AddZone
          insertIndex={0}
          isOpen={openPickerIndex === 0}
          manifests={manifests}
          onAddClick={handleAddClick}
          onSelect={handlePickerSelect}
        />

        {/* Web parts with add zones after each */}
        {activeWebParts.map((webPart, index) => (
          <Fragment key={webPart.instanceId}>
            <WebPartZone
              webPart={webPart}
              onEdit={() => onEditWebPart(index)}
              onDelete={() => onDeleteWebPart(index)}
            />
            <AddZone
              insertIndex={index + 1}
              isOpen={openPickerIndex === index + 1}
              manifests={manifests}
              onAddClick={handleAddClick}
              onSelect={handlePickerSelect}
              locale={locale}
            />
          </Fragment>
        ))}
      </div>

      {/* Overlay */}
      {openPickerIndex !== null && (
        <div id="picker-overlay" className={styles.pickerOverlay} onClick={handleOverlayClick} />
      )}
    </>
  );
};

interface IAddZoneProps {
  insertIndex: number;
  isOpen: boolean;
  manifests: IComponentManifest[];
  onAddClick: (insertIndex: number) => void;
  onSelect: (manifestIndex: number, insertIndex?: number, preconfiguredEntryIndex?: number) => void;
  locale?: string;
}

const AddZone: FC<IAddZoneProps> = ({
  insertIndex,
  isOpen,
  manifests,
  onAddClick,
  onSelect,
  locale,
}) => {
  const availableWebParts = useMemo(() => {
    const items: IComponentItem[] = [];
    manifests
      .map((m, manifestIndex) => ({ ...m, manifestIndex }))
      .filter(
        (m): m is IWebPartManifest & { manifestIndex: number } => m.componentType === 'WebPart',
      )
      .forEach((wp) => {
        const entries = wp.preconfiguredEntries?.length ? wp.preconfiguredEntries : [undefined];
        entries.forEach((entry, entryIndex) => {
          const title = getLocalizedString(entry?.title, locale) || wp.alias;
          const description = getLocalizedString(entry?.description, locale) || '';
          const iconName = entry?.officeFabricIconFontName;
          const iconSrc = entry?.iconImageUrl;
          items.push({
            id: `${wp.id}-${entryIndex}`,
            title,
            description,
            iconName,
            iconSrc,
            manifestIndex: wp.manifestIndex,
            preconfiguredEntryIndex: entryIndex,
            hiddenFromToolbox: wp.hiddenFromToolbox === true,
          });
        });
      });
    return items;
  }, [manifests, locale]);
  return (
    <div className={styles.addZone} data-insert-index={insertIndex}>
      <div className={styles.addZoneLine} />
      <button
        className={styles.addZoneButton}
        title="Add a web part"
        onClick={(e) => {
          e.stopPropagation();
          onAddClick(insertIndex);
        }}
      >
        +
      </button>
      <div className={styles.addZoneLine} />
      <ComponentPicker
        location={insertIndex}
        components={availableWebParts}
        isOpen={isOpen}
        resultsLabel="Available web parts"
        noResultsLabel="No web parts found"
        onSelect={(manifestIndex, location, preconfiguredEntryIndex) =>
          onSelect(manifestIndex, location, preconfiguredEntryIndex)
        }
      />
    </div>
  );
};

interface IWebPartZoneProps {
  webPart: IWebPartConfig;
  onEdit: () => void;
  onDelete: () => void;
}

const WebPartZone: FC<IWebPartZoneProps> = ({ webPart, onEdit, onDelete }) => {
  return (
    <div className={styles.webPartZone}>
      <div className={styles.webPartToolbar}>
        <IconButton
          iconProps={{ iconName: 'Edit' }}
          title="Edit properties"
          ariaLabel="Edit properties"
          onClick={onEdit}
        />
        <IconButton
          iconProps={{ iconName: 'Delete' }}
          title="Delete"
          ariaLabel="Delete web part"
          onClick={onDelete}
        />
      </div>
      <div className={styles.webPartContainer}>
        <div className={styles.webPartContent} id={`webpart-${webPart.instanceId}`}>
          {/* Web part rendered here by WorkbenchRuntime */}
        </div>
      </div>
    </div>
  );
};
