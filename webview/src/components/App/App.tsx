import React, { useState, useEffect, FC } from 'react';
import type { IWorkbenchConfig, IWebPartManifest, IWebPartConfig, IActiveWebPart, IExtensionConfig } from '../../types';
import { isActiveWebPart } from '../../types';
import { WorkbenchCanvas } from '../WorkbenchCanvas';
import { PropertyPanePanel } from '../PropertyPanePanel';
import { ErrorBoundary } from '../ErrorBoundary';
import { Toolbar } from '../Toolbar';
import { ExtensionPropertiesPanel } from '../ExtensionPropertiesPanel';
import { css, IconButton } from '@fluentui/react';
import styles from './App.module.css';
import { ComponentPicker } from '../ComponentPicker';

interface IAppProps {
    config: IWorkbenchConfig;
    onInitialized: (handlers: IAppHandlers) => void;
}

export interface IAppHandlers {
    setManifests: (manifests: IWebPartManifest[]) => void;
    setActiveWebParts: (webParts: IWebPartConfig[]) => void;
    setActiveExtensions: (extensions: IExtensionConfig[]) => void;
    openPropertyPane: (webPart: IActiveWebPart) => void;
    closePropertyPane: () => void;
    updateWebPartProperties: (instanceId: string, properties: any) => void;
}

export const App: FC<IAppProps> = ({ config, onInitialized }) => {
    const [manifests, setManifests] = useState<IWebPartManifest[]>([]);
    const [activeWebParts, setActiveWebParts] = useState<IWebPartConfig[]>([]);
    const [activeExtensions, setActiveExtensions] = useState<IExtensionConfig[]>([]);
    const [selectedWebPart, setSelectedWebPart] = useState<IActiveWebPart>();
    const [selectedExtension, setSelectedExtension] = useState<IExtensionConfig>();
    const [extensionPickerOpen, setExtensionPickerOpen] = useState(false);

    const availableExtensions = manifests
        .filter(m => m.componentType === 'Extension')
        .map((ext, manifestIndex) => ({...ext, title: ext.alias, manifestIndex}));
    
    // Expose handlers to parent (WorkbenchRuntime)
    useEffect(() => {
        const handlers: IAppHandlers = {
            setManifests,
            setActiveWebParts,
            setActiveExtensions,
            openPropertyPane: (webPart: IActiveWebPart) => setSelectedWebPart(webPart),
            closePropertyPane: () => setSelectedWebPart(undefined),
            updateWebPartProperties: (instanceId: string, properties: any) => {
                setActiveWebParts(prev => prev.map(wp => 
                    wp.instanceId === instanceId ? { ...wp, properties } : wp
                ));
                // Update selectedWebPart if it's the one being modified
                setSelectedWebPart(prev => {
                    if (prev && prev.instanceId === instanceId) {
                        return { ...prev, properties };
                    }
                    return prev;
                });
            }
        };
        onInitialized(handlers);
    }, [onInitialized]);

    const handleRefresh = () => {
        window.dispatchEvent(new CustomEvent('refresh'));
    };

    const handleOpenDevTools = () => {
        window.dispatchEvent(new CustomEvent('openDevTools'));
    };

    return (
        <ErrorBoundary>
            <div className={styles.workbenchApp}>
                <Toolbar onRefresh={handleRefresh} onOpenDevTools={handleOpenDevTools} />
                {/* Application Customizer Header Placeholder */}         
                <div id="app-customizer-header" className={css(styles.appCustomizerZone, styles.appCustomizerHeader)}>
                    {activeExtensions.map((ext) => (
                        <div key={ext.instanceId + '-header'} className={styles.appCustomizerExtensionWrapper}>
                            <div className={styles.appCustomizerExtensionToolbar}>
                                <span className={styles.appCustomizerExtensionLabel}>
                                    {ext.manifest.alias}
                                </span>
                                <IconButton
                                    iconProps={{ iconName: 'Edit' }}
                                    title="Edit properties"
                                    ariaLabel="Edit properties"
                                    styles={{ root: { color: '#0078d4', height: 24, width: 24 }, icon: { fontSize: 12 } }}
                                    onClick={() => setSelectedExtension(ext)}
                                />
                                <IconButton
                                    iconProps={{ iconName: 'Delete' }}
                                    title="Remove extension"
                                    ariaLabel="Remove extension"
                                    styles={{ root: { color: '#a80000', height: 24, width: 24 }, icon: { fontSize: 12 } }}
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('removeExtension', { detail: { instanceId: ext.instanceId } }));
                                    }}
                                />
                            </div>
                            <div
                                className="app-customizer-header-content"
                                id={`ext-header-${ext.instanceId}`}
                            />
                        </div>
                    ))}
                    {availableExtensions.length > 0 && (
                        <div className={styles.appCustomizerAddZone}>
                            <div className={styles.addZoneLine} />
                            <button
                                className={styles.addZoneButton}
                                title="Add an extension"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExtensionPickerOpen(!extensionPickerOpen);
                                }}
                            >
                                +
                            </button>
                            <div className={styles.addZoneLine} />
                            <ComponentPicker
                                components={availableExtensions}
                                isOpen={extensionPickerOpen}
                                resultsLabel="Available extensions"
                                noResultsLabel="No extensions found"
                                onSelect={(manifestIndex: number) => {
                                    setExtensionPickerOpen(false);
                                    window.dispatchEvent(new CustomEvent('addExtension', { detail: { manifestIndex } }));
                                }}
                            />
                        </div>
                    )}
                </div>

                <WorkbenchCanvas
                    manifests={manifests}
                    activeWebParts={activeWebParts}
                    onAddWebPart={(insertIndex, manifestIndex) => {
                        window.dispatchEvent(new CustomEvent('addWebPart', { 
                            detail: { insertIndex, manifestIndex } 
                        }));
                    }}
                    onEditWebPart={(index) => {
                        const webPart = activeWebParts[index];
                        console.log('Selected web part for editing:', webPart);
                        if (webPart && isActiveWebPart(webPart)) {
                            setSelectedWebPart(webPart);
                        } else {
                            console.warn(`Web part at index ${index} is not active or does not exist.`);
                        }
                    }}
                    onDeleteWebPart={(index) => {
                        window.dispatchEvent(new CustomEvent('deleteWebPart', { 
                            detail: { index } 
                        }));
                    }}
                />

                {/* Application Customizer Footer Placeholder */}
                <div id="app-customizer-footer" className={css(styles.appCustomizerZone, styles.appCustomizerFooter)}>
                    {activeExtensions.map((ext) => (
                        <div
                            key={ext.instanceId + '-footer'}
                            className="app-customizer-footer-content"
                            id={`ext-footer-${ext.instanceId}`}
                        >
                            <div className={styles.appCustomizerExtensionToolbar}>
                                <span className={styles.appCustomizerExtensionLabel}>
                                    {ext.manifest.alias}
                                </span>
                                <IconButton
                                    iconProps={{ iconName: 'Edit' }}
                                    title="Edit properties"
                                    ariaLabel="Edit properties"
                                    styles={{ root: { color: '#0078d4', height: 24, width: 24 }, icon: { fontSize: 12 } }}
                                    onClick={() => setSelectedExtension(ext)}
                                />
                                <IconButton
                                    iconProps={{ iconName: 'Delete' }}
                                    title="Remove extension"
                                    ariaLabel="Remove extension"
                                    styles={{ root: { color: '#a80000', height: 24, width: 24 }, icon: { fontSize: 12 } }}
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('removeExtension', { detail: { instanceId: ext.instanceId } }));
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Extension picker overlay */}
                {extensionPickerOpen && (
                    <div
                        className={styles.pickerOverlay}
                        onClick={() => setExtensionPickerOpen(false)}
                    />
                )}

                <PropertyPanePanel
                    webPart={selectedWebPart}
                    onClose={() => setSelectedWebPart(undefined)}
                    onPropertyChange={(targetProperty, newValue) => {
                        if (selectedWebPart) {
                            window.dispatchEvent(new CustomEvent('updateProperty', {
                                detail: {
                                    instanceId: selectedWebPart.instanceId,
                                    targetProperty,
                                    newValue
                                }
                            }));
                        }
                    }}
                />

                <ExtensionPropertiesPanel
                    extension={selectedExtension}
                    onClose={() => setSelectedExtension(undefined)}
                    onPropertyChange={(instanceId, properties) => {
                        window.dispatchEvent(new CustomEvent('updateExtensionProperties', {
                            detail: { instanceId, properties }
                        }));
                        setSelectedExtension(undefined);
                    }}
                />
            </div>
        </ErrorBoundary>
    );
};
