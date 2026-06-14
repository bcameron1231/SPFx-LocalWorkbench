import { Link } from '@fluentui/react';
import React, { FC } from 'react';

interface ILinkComponentProps {
  href?: string;
  target?: string;
  text?: string;
}

export const LinkComponent: FC<ILinkComponentProps> = ({ href, target = '_blank', text }) => (
  <Link href={href} target={target} rel="noopener noreferrer">
    {text}
  </Link>
);
