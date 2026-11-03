import React, { FC } from 'react';

import type { SectionLayout } from '../../canvas/pageLayout';

/**
 * Outline icons for the section layouts, drawn for the workbench in the style of SharePoint's
 * (a rounded frame with the columns marked).
 */
export const LayoutIcon: FC<{ layout: SectionLayout | 'flexible'; size?: number }> = ({
  layout,
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    {layout === 'vertical' ? (
      <>
        <rect x={4} y={4} width={24} height={24} rx={3.5} strokeDasharray="4 3" />
        <rect x={19} y={4} width={9} height={24} rx={3} fill="currentColor" fillOpacity={0.15} />
      </>
    ) : (
      <rect x={4} y={4} width={24} height={24} rx={3.5} />
    )}
    {layout === 'twoColumns' && <line x1={16} y1={4} x2={16} y2={28} />}
    {layout === 'threeColumns' && (
      <>
        <line x1={12} y1={4} x2={12} y2={28} />
        <line x1={20} y1={4} x2={20} y2={28} />
      </>
    )}
    {layout === 'oneThirdLeft' && <line x1={12} y1={4} x2={12} y2={28} />}
    {layout === 'oneThirdRight' && <line x1={20} y1={4} x2={20} y2={28} />}
    {layout === 'fullWidth' && (
      <>
        <path d="M9 16h14M9 16l3-3M9 16l3 3M23 16l-3-3M23 16l-3 3" />
      </>
    )}
    {layout === 'flexible' && (
      <>
        <line x1={4} y1={15} x2={28} y2={15} />
        <line x1={14} y1={4} x2={14} y2={15} />
        <line x1={18} y1={15} x2={18} y2={28} />
      </>
    )}
  </svg>
);
