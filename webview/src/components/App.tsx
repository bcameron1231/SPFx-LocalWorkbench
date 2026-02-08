import React, { useState, useEffect, FC } from 'react';
import type { IWorkbenchConfig, IWebPartManifest, IActiveWebPart, IActiveExtension } from '../types';
import { WorkbenchCanvas } from './WorkbenchCanvas';
import { PropertyPanePanel } from './PropertyPanePanel';
import { ErrorBoundary } from './ErrorBoundary';
import { Toolbar } from './Toolbar';
import { ExtensionPicker } from './ExtensionPicker';
import { ExtensionPropertiesPanel } from './ExtensionPropertiesPanel';
import { IconButton } from '@fluentui/react';

interface IAppProps {
    config: IWorkbenchConfig;
    onInitialized: (handlers: IAppHandlers) => void;
}

export interface IAppHandlers {
    setManifests: (manifests: IWebPartManifest[]) => void;
    setActiveWebParts: (webParts: IActiveWebPart[]) => void;
    setActiveExtensions: (extensions: IActiveExtension[]) => void;
    openPropertyPane: (webPart: IActiveWebPart) => void;
    closePropertyPane: () => void;
    updateWebPartProperties: (instanceId: string, properties: any) => void;
}

export const App: FC<IAppProps> = ({ config, onInitialized }) => {
    const [manifests, setManifests] = useState<IWebPartManifest[]>([]);
    const [activeWebParts, setActiveWebParts] = useState<IActiveWebPart[]>([]);
    const [activeExtensions, setActiveExtensions] = useState<IActiveExtension[]>([]);
    const [selectedWebPart, setSelectedWebPart] = useState<IActiveWebPart | null>(null);
    const [selectedExtension, setSelectedExtension] = useState<IActiveExtension | null>(null);
    const [extensionPickerOpen, setExtensionPickerOpen] = useState(false);

    const extensionManifests = manifests.filter(m => m.componentType === 'Extension');

    // Expose handlers to parent (WorkbenchRuntime)
    useEffect(() => {
        const handlers: IAppHandlers = {
            setManifests,
            setActiveWebParts,
            setActiveExtensions,
            openPropertyPane: (webPart: IActiveWebPart) => setSelectedWebPart(webPart),
            closePropertyPane: () => setSelectedWebPart(null),
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
            <div className="workbench-app">
                <Toolbar onRefresh={handleRefresh} onOpenDevTools={handleOpenDevTools} />
                
                {/* Application Customizer Header Placeholder */}
                <div className="app-customizer-zone app-customizer-header" id="app-customizer-header">
                    {activeExtensions.map((ext, index) => (
                        <div key={ext.instanceId} className="app-customizer-extension-wrapper">
                            <div className="app-customizer-extension-toolbar">
                                <span className="app-customizer-extension-label">
                                    {ext.manifest.preconfiguredEntries?.[0]?.title?.default || ext.manifest.alias}
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
                    {extensionManifests.length > 0 && (
                        <div className="app-customizer-add-zone">
                            <div className="add-zone-line" />
                            <button
                                className="add-zone-button"
                                title="Add an extension"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExtensionPickerOpen(!extensionPickerOpen);
                                }}
                            >
                                +
                            </button>
                            <div className="add-zone-line" />
                            <ExtensionPicker
                                manifests={manifests}
                                isOpen={extensionPickerOpen}
                                onSelect={(manifestIndex) => {
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
                        if (webPart) {
                            setSelectedWebPart(webPart);
                        }
                    }}
                    onDeleteWebPart={(index) => {
                        window.dispatchEvent(new CustomEvent('deleteWebPart', { 
                            detail: { index } 
                        }));
                    }}
                />

                {/* Extension picker overlay */}
                {extensionPickerOpen && (
                    <div
                        className="picker-overlay open"
                        onClick={() => setExtensionPickerOpen(false)}
                    />
                )}

                <PropertyPanePanel
                    webPart={selectedWebPart}
                    onClose={() => setSelectedWebPart(null)}
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
                    onClose={() => setSelectedExtension(null)}
                    onPropertyChange={(instanceId, properties) => {
                        window.dispatchEvent(new CustomEvent('updateExtensionProperties', {
                            detail: { instanceId, properties }
                        }));
                        setSelectedExtension(null);
                    }}
                />
            </div>
        </ErrorBoundary>
    );
};
