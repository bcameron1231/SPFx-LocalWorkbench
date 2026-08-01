import { IconButton, Separator } from '@storybook/components';
import { ControlsIcon } from '@storybook/icons';
import { useGlobals } from '@storybook/manager-api';
import React from 'react';

import { DisplayMode, STORYBOOK_GLOBAL_KEYS } from '../../constants';

/** Toolbar control for the live preview-side SPFx property pane. */
export const PropertyPaneToolbar: React.FC = () => {
  const [globals, updateGlobals] = useGlobals();
  const displayMode = globals[STORYBOOK_GLOBAL_KEYS.DISPLAY_MODE] ?? DisplayMode.Edit;
  const isOpen = globals[STORYBOOK_GLOBAL_KEYS.PROPERTY_PANE_OPEN] === true;
  const isDisabled = displayMode !== DisplayMode.Edit;

  return (
    <>
      <Separator />
      <IconButton
        active={isOpen}
        disabled={isDisabled}
        title={
          isDisabled
            ? 'Properties are only available in Edit mode'
            : isOpen
              ? 'Close properties'
              : 'Edit properties'
        }
        onClick={() => {
          if (!isDisabled) {
            updateGlobals({
              [STORYBOOK_GLOBAL_KEYS.PROPERTY_PANE_OPEN]: !isOpen,
            });
          }
        }}
      >
        <ControlsIcon />
      </IconButton>
    </>
  );
};
