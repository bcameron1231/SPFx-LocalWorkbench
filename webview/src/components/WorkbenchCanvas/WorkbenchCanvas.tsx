import React, { useState, Fragment, FC, useMemo } from 'react';
import { IconButton, Text, Stack } from '@fluentui/react';
import type { IWebPartManifest, IWebPartConfig } from '../../types';
//import { WebPartPicker } from '../WebPartPicker';
import styles from './WorkbenchCanvas.module.css';
import { ComponentPicker } from '../ComponentPicker';
import { getLocalizedString } from '../../utilities';

interface IWorkbenchCanvasProps {
    manifests: IWebPartManifest[];
    activeWebParts: IWebPartConfig[];
    onAddWebPart: (insertIndex: number, manifestIndex: number) => void;
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

    const handleAddClick = (insertIndex: number) => {
        setOpenPickerIndex(openPickerIndex === insertIndex ? null : insertIndex);
    };

    const handlePickerSelect = (manifestIndex: number, insertIndex: number = 0) => {
        setOpenPickerIndex(null);
        onAddWebPart(insertIndex, manifestIndex);
    };

    const handleOverlayClick = () => {
        setOpenPickerIndex(null);
    };

    if (manifests.length === 0) {
        return (
            <div id="canvas">
                <Stack horizontalAlign="center" styles={{ root: { padding: '24px' } }}>
                    <Text variant="large" styles={{ root: { color: '#a80000' } }}>
                        No SPFx components found. Make sure your project is served / running.
                    </Text>
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
                <div 
                    id="picker-overlay" 
                    className={styles.pickerOverlay}
                    onClick={handleOverlayClick}
                />
            )}
        </>
    );
};

interface IAddZoneProps {
    insertIndex: number;
    isOpen: boolean;
    manifests: IWebPartManifest[];
    onAddClick: (insertIndex: number) => void;
    onSelect: (manifestIndex: number, insertIndex?: number) => void;
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
        return manifests.map((m,manifestIndex) => ({...m, manifestIndex})).filter(m => m.componentType === 'WebPart').map((wp, index) => {
            const title = getLocalizedString(wp.preconfiguredEntries?.[0]?.title, locale) || wp.alias;
            const description = getLocalizedString(wp.preconfiguredEntries?.[0]?.description, locale) || '';
            const iconName = wp.preconfiguredEntries?.[0]?.officeFabricIconFontName;
            const iconSrc = wp.preconfiguredEntries?.[0]?.iconImageUrl;
            return { ...wp, title, description, iconName, iconSrc };
        });
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
                onSelect={onSelect}
            />
        </div>
    );
};

interface IWebPartZoneProps {
    webPart: IWebPartConfig;
    onEdit: () => void;
    onDelete: () => void;
}

const WebPartZone: FC<IWebPartZoneProps> = ({
    webPart,
    onEdit,
    onDelete
}) => {
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
