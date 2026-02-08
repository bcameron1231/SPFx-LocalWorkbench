import React, { useState, Fragment, FC } from 'react';
import { IconButton, Text, Stack } from '@fluentui/react';
import type { IWebPartManifest, IWebPartConfig } from '../../types';
import { WebPartPicker } from '../WebPartPicker';
import styles from './WorkbenchCanvas.module.css';

interface IWorkbenchCanvasProps {
    manifests: IWebPartManifest[];
    activeWebParts: IWebPartConfig[];
    onAddWebPart: (insertIndex: number, manifestIndex: number) => void;
    onEditWebPart: (index: number) => void;
    onDeleteWebPart: (index: number) => void;
}

export const WorkbenchCanvas: FC<IWorkbenchCanvasProps> = ({
    manifests,
    activeWebParts,
    onAddWebPart,
    onEditWebPart,
    onDeleteWebPart
}) => {
    const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);

    const handleAddClick = (insertIndex: number) => {
        setOpenPickerIndex(openPickerIndex === insertIndex ? null : insertIndex);
    };

    const handlePickerSelect = (insertIndex: number, manifestIndex: number) => {
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
                        No web parts found. Make sure your web part is served / running.
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
                            index={index}
                            onEdit={() => onEditWebPart(index)}
                            onDelete={() => onDeleteWebPart(index)}
                        />
                        <AddZone
                            insertIndex={index + 1}
                            isOpen={openPickerIndex === index + 1}
                            manifests={manifests}
                            onAddClick={handleAddClick}
                            onSelect={handlePickerSelect}
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
    onSelect: (insertIndex: number, manifestIndex: number) => void;
}

const AddZone: FC<IAddZoneProps> = ({
    insertIndex,
    isOpen,
    manifests,
    onAddClick,
    onSelect
}) => {
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
            <WebPartPicker
                insertIndex={insertIndex}
                manifests={manifests}
                isOpen={isOpen}
                onSelect={onSelect}
            />
        </div>
    );
};

interface IWebPartZoneProps {
    webPart: IWebPartConfig;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
}

const WebPartZone: FC<IWebPartZoneProps> = ({
    webPart,
    index,
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
                <div className={styles.webPartContent} id={`webpart-${index}`}>
                    {/* Web part rendered here by WorkbenchRuntime */}
                </div>
            </div>
        </div>
    );
};
