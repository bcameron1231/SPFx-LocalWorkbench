import { Text } from '@fluentui/react';
import React, { FC } from 'react';

import { getString } from '../shared';

interface IHeadingComponentProps {
  field: any;
}

export const HeadingComponent: FC<IHeadingComponentProps> = ({ field }) => {
  const text = getString(field.properties?.text || field.properties?.Text);
  return (
    <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
      {text}
    </Text>
  );
};
