import { Icon, SearchBox, Stack, Text, css } from '@fluentui/react';
import React, { FC, useEffect, useRef, useState } from 'react';
import styles from './ComponentPicker.module.css';

export interface IComponentItem {
    id: string;
    title: string;
    description?: string;
    iconName?: string;
    iconSrc?: string;
    manifestIndex: number;
}

interface IComponentPickerProps {
    location?: number; // TODO: Section support
    components: IComponentItem[];
    isOpen: boolean;
    resultsLabel?: string;
    noResultsLabel?: string;
    onSelect: (manifestIndex: number, location?: number) => void;
}

export const ComponentPicker: FC<IComponentPickerProps> = props => {
    const { components, isOpen, resultsLabel, noResultsLabel, onSelect, location } = props;
    const [filter, setFilter] = useState('');
    const [openUpward, setOpenUpward] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Reset filter when picker closes
    useEffect(() => {
        if (!isOpen) {
            setFilter('');
            setOpenUpward(false);
        }
        if (isOpen && popupRef.current) {
            const rect = popupRef.current.getBoundingClientRect();
            if (rect.bottom > window.innerHeight) {
                setOpenUpward(true);
            }
        }
    }, [isOpen]);

    const filteredComponents = components.filter(component => {
        if (!filter) return true;
        return component.title.toLowerCase().includes(filter.toLowerCase()) || (component.description && component.description.toLowerCase().includes(filter.toLowerCase()));
    });

    return (
        <div ref={popupRef} className={css(styles.popup, isOpen && styles.open, openUpward && styles.upward)}>
            <Stack>
                <SearchBox
                    placeholder="Search"
                    className={styles.search}
                    value={filter}
                    onChange={(_, newValue) => setFilter(newValue || '')}
                    autoFocus={isOpen}
                />
                <Text variant="medium" className={styles.resultsLabel}>
                    {resultsLabel || 'Available components'}
                </Text>
                <div className={styles.results} id={`picker-results-${location ?? 0}`}>
                    {filteredComponents.length > 0 ? (
                        filteredComponents.map((component) => {
                            return (
                                <div
                                    key={component.id}
                                    className={styles.item}
                                    data-insert={location}
                                    data-manifest={component.manifestIndex}
                                    onClick={() => onSelect(component.manifestIndex, location)}
                                >
                                    {component.iconName && (
                                        <Icon iconName={component.iconName} className={styles.itemIcon} />
                                    )}
                                    {!component.iconName && component.iconSrc && (
                                        <img src={component.iconSrc} alt="" className={styles.itemIcon} />
                                    )}
                                    {!component.iconName && !component.iconSrc && (
                                        <Icon iconName="WebComponents" className={styles.itemIcon} />
                                    )}
                                    <Text className={styles.itemText}>{component.title}</Text>
                                </div>
                            );
                        })
                    ) : (
                        <Stack verticalAlign='center' horizontalAlign='center'>
                            <Text className={styles.noResults}>
                                {noResultsLabel || 'No results found'}
                            </Text>
                        </Stack>
                    )}
                </div>
            </Stack>
        </div>
    );
};
