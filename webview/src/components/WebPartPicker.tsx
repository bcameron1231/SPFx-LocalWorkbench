import React, { useState, useEffect, FC } from 'react';
import { SearchBox, Text, Stack, Icon } from '@fluentui/react';
import type { IWebPartManifest } from '../types';

interface IWebPartPickerProps {
    insertIndex: number;
    manifests: IWebPartManifest[];
    isOpen: boolean;
    onSelect: (insertIndex: number, manifestIndex: number) => void;
}

export const WebPartPicker: FC<IWebPartPickerProps> = ({
    insertIndex,
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

    const webParts = manifests.filter(m => m.componentType === 'WebPart');

    const filteredWebParts = webParts.filter(wp => {
        if (!filter) return true;
        const title = wp.preconfiguredEntries?.[0]?.title?.default || wp.alias;
        return title.toLowerCase().includes(filter.toLowerCase());
    });

    return (
        <div className={`webpart-picker-popup ${isOpen ? 'open' : ''}`} id={`picker-${insertIndex}`}>
            <Stack tokens={{ childrenGap: 8 }} styles={{ root: { padding: '12px' } }}>
                <SearchBox
                    placeholder="Search web parts"
                    value={filter}
                    onChange={(_, newValue) => setFilter(newValue || '')}
                    autoFocus={isOpen}
                />
                <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                    Available web parts
                </Text>
                <div className="picker-results" id={`picker-results-${insertIndex}`}>
                    {filteredWebParts.length > 0 ? (
                        filteredWebParts.map((wp) => {
                            const title = wp.preconfiguredEntries?.[0]?.title?.default || wp.alias;
                            const manifestIndex = webParts.findIndex(w => w.id === wp.id);
                            return (
                                <div
                                    key={wp.id}
                                    className="picker-item"
                                    data-insert={insertIndex}
                                    data-manifest={manifestIndex}
                                    onClick={() => onSelect(insertIndex, manifestIndex)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        transition: 'background-color 0.1s'
                                    }}
                                >
                                    <Icon iconName="WebAppBuilderFragment" styles={{ root: { fontSize: '20px', marginRight: '12px' } }} />
                                    <Text>{title}</Text>
                                </div>
                            );
                        })
                    ) : (
                        <Stack horizontalAlign="center" styles={{ root: { padding: '12px' } }}>
                            <Text styles={{ root: { color: '#605e5c' } }}>
                                No web parts found
                            </Text>
                        </Stack>
                    )}
                </div>
            </Stack>
        </div>
    );
};
