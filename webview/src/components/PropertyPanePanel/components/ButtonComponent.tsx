import { PrimaryButton } from '@fluentui/react';
import React, { FC } from 'react';

import { getString } from '../shared';

interface IButtonComponentProps {
  field: any;
}

export const ButtonComponent: FC<IButtonComponentProps> = ({ field }) => {
  const text = getString(field.properties?.text || field.properties?.Text);
  return (
    <PrimaryButton
      text={text}
      onClick={() => {
        if (field.properties?.onClick) {
          field.properties.onClick();
        }
      }}
    />
  );
};
