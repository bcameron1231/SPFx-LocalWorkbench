import { Link } from '@fluentui/react';
import React, { FC } from 'react';

import { getString } from '../shared';

interface ILinkComponentProps {
  field: any;
}

export const LinkComponent: FC<ILinkComponentProps> = ({ field }) => {
  const text = getString(field.properties?.text || field.properties?.Text);
  const href = field.properties?.href || field.properties?.Href;
  return (
    <Link href={href} target={field.properties?.target || '_blank'} rel="noopener noreferrer">
      {text}
    </Link>
  );
};
