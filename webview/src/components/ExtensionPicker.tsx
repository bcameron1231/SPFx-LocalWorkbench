import React, { useState, useEffect, FC } from 'react';
import { SearchBox, Text, Stack, Icon } from '@fluentui/react';
import type { IWebPartManifest } from '../types';

interface IExtensionPickerProps {
    manifests: IWebPartManifest[];
    isOpen: boolean;
    onSelect: (manifestIndex: number) => void;
}

export const ExtensionPicker: FC<IExtensionPickerProps> = ({
    manifests,
    isOpen,
    onSelect
}) => {
    const [filter, setFilter] = useState('');

    // Reset filter when picker closes
    useEffect(() => {
        if (!isOpen) {
            setFilter('');
        }
    }, [isOpen]);

    const extensions = manifests.filter(m => m.componentType === 'Extension');

    const filteredExtensions = extensions.filter(ext => {
        if (!filter) return true;
        const title = ext.preconfiguredEntries?.[0]?.title?.default || ext.alias;
        return title.toLowerCase().includes(filter.toLowerCase());
    });

    const popupClassName = `extension-picker-popup ${isOpen ? 'open' : ''}`;

    return (
        <div className={popupClassName}>
            <Stack tokens={{ childrenGap: 8 }} styles={{ root: { padding: '12px' } }}>
                <SearchBox
                    placeholder="Search extensions"
                    value={filter}
                    onChange={(_, newValue) => setFilter(newValue || '')}
                    autoFocus={isOpen}
                />
                <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                    Available extensions
                </Text>
                <div className="picker-results">
                    {filteredExtensions.length > 0 ? (
                        filteredExtensions.map((ext) => {
                            const title = ext.preconfiguredEntries?.[0]?.title?.default || ext.alias;
                            const manifestIndex = extensions.findIndex(e => e.id === ext.id);
                            return (
                                <div
                                    key={ext.id}
                                    className="picker-item"
                                    onClick={() => {
                                        onSelect(manifestIndex);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        transition: 'background-color 0.1s'
                                    }}
                                >
                                    <Icon iconName="CustomizeToolbar" styles={{ root: { fontSize: '20px', marginRight: '12px' } }} />
                                    <Text>{title}</Text>
                                </div>
                            );
                        })
                    ) : (
                        <Stack horizontalAlign="center" styles={{ root: { padding: '12px' } }}>
                            <Text styles={{ root: { color: '#605e5c' } }}>
                                No extensions found
                            </Text>
                        </Stack>
                    )}
                </div>
            </Stack>
        </div>
    );
};
