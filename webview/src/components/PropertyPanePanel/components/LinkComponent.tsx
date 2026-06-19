import { Link } from '@fluentui/react';
import React, { FC } from 'react';

interface ILinkComponentProps {
  ariaLabel?: string;
  disabled?: boolean;
  href?: string;
  target?: string;
  text?: string;
}

export const LinkComponent: FC<ILinkComponentProps> = ({
  ariaLabel,
  disabled,
  href,
  target = '_blank',
  text,
}) => (
  <Link ariaLabel={ariaLabel} disabled={disabled} href={href} target={target} rel="noopener noreferrer">
    {text}
  </Link>
);
