import React, { FC } from 'react';
import { Stack, Text, IconButton } from '@fluentui/react';

interface IToolbarProps {
    onRefresh: () => void;
    onOpenDevTools: () => void;
}

export const Toolbar: FC<IToolbarProps> = ({ onRefresh, onOpenDevTools }) => {
    return (
        <Stack
            horizontal
            horizontalAlign="space-between"
            verticalAlign="center"
            styles={{
                root: {
                    height: '48px',
                    padding: '0 16px',
                    backgroundColor: '#f3f2f1',
                    borderBottom: '1px solid #edebe9'
                }
            }}
        >
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, color: '#323130' } }}>
                SPFx Local Workbench
            </Text>
            <Stack horizontal tokens={{ childrenGap: 4 }}>
                <IconButton
                    iconProps={{ iconName: 'Refresh' }}
                    title="Refresh"
                    ariaLabel="Refresh"
                    onClick={onRefresh}
                />
                <IconButton
                    iconProps={{ iconName: 'DeveloperTools' }}
                    title="Developer Tools"
                    ariaLabel="Open Developer Tools"
                    onClick={onOpenDevTools}
                />
            </Stack>
        </Stack>
    );
};
