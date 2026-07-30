import * as React from 'react';

export interface IScenarioIconProps {
  className?: string;
  title?: string;
}

/** Host-neutral glyph representing layered proxy scenarios. */
export const ScenarioIcon: React.FC<IScenarioIconProps> = ({ className, title }) => (
  <svg
    className={className}
    width="1em"
    height="1em"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : 'presentation'}
  >
    {title ? <title>{title}</title> : null}
    <rect x="2.25" y="2.25" width="7.5" height="3.5" rx="1" stroke="currentColor" />
    <rect x="4.25" y="6.25" width="7.5" height="3.5" rx="1" stroke="currentColor" />
    <rect x="6.25" y="10.25" width="7.5" height="3.5" rx="1" stroke="currentColor" />
  </svg>
);
