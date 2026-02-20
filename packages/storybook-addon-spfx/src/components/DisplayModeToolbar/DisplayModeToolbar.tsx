/**
 * Display Mode toolbar control
 * Allows switching between Edit and Read display modes
 */
import { IconButton, Separator } from '@storybook/components';
import { EditIcon, EyeIcon } from '@storybook/icons';
import { useGlobals } from '@storybook/manager-api';
import React from 'react';

import { DisplayMode, STORYBOOK_GLOBAL_KEYS } from '../../constants';

export const DisplayModeToolbar: React.FC = () => {
  const [globals, updateGlobals] = useGlobals();
  const displayMode = globals[STORYBOOK_GLOBAL_KEYS.DISPLAY_MODE] || DisplayMode.Edit;

  const toggleDisplayMode = () => {
    const newMode = displayMode === DisplayMode.Edit ? DisplayMode.Read : DisplayMode.Edit;
    updateGlobals({ [STORYBOOK_GLOBAL_KEYS.DISPLAY_MODE]: newMode });
  };

  const isEditMode = displayMode === DisplayMode.Edit;
  const title = isEditMode ? 'Switch to Preview' : 'Switch to Edit mode';
  const Icon = isEditMode ? EditIcon : EyeIcon;

  return (
    <>
      <Separator />
      <IconButton title={title} onClick={toggleDisplayMode}>
        <Icon />
      </IconButton>
    </>
  );
};
