import { Text } from '@fluentui/react';
import React, { FC } from 'react';

interface IHeadingComponentProps {
  text?: string;
}

export const HeadingComponent: FC<IHeadingComponentProps> = ({ text }) => (
  <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
    {text}
  </Text>
);
