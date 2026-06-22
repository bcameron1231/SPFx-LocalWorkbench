import { Guid } from '@microsoft/sp-core-library';
import type { IDynamicDataPropertyDefinition } from '@microsoft/sp-dynamic-data';
import type { IDynamicDataDetails, IDynamicDataSourceState } from './types';

export const DYNAMIC_DATA_PROPERTY_IDS = {
  text: 'text',
  count: 'count',
  summary: 'summary',
  pvDepth: 'pvDepth',
  details: 'details',
} as const;

export const DYNAMIC_DATA_SOURCE_COMPONENT_ID = Guid.parse(
  '1d9314e3-672f-4f6f-8db1-c7fd5f58d1e8',
);

export const DYNAMIC_DATA_CONDITIONAL_ACTIONS = {
  none: 'none yet',
  primary: 'onShowPrimaryGroup',
  secondary: 'onShowSecondaryGroup',
} as const;

/** Shared source metadata keeps the connection picker labels stable across both workbenches. */
export const DYNAMIC_DATA_PROPERTY_DEFINITIONS: ReadonlyArray<IDynamicDataPropertyDefinition> = [
  {
    id: DYNAMIC_DATA_PROPERTY_IDS.text,
    title: 'Source Text',
  },
  {
    id: DYNAMIC_DATA_PROPERTY_IDS.count,
    title: 'Source Count',
  },
  {
    id: DYNAMIC_DATA_PROPERTY_IDS.summary,
    title: 'Source Summary',
  },
  {
    id: DYNAMIC_DATA_PROPERTY_IDS.pvDepth,
    title: 'Property Value Depth',
  },
  {
    id: DYNAMIC_DATA_PROPERTY_IDS.details,
    title: 'Source Details (Object)',
  },
];

/** Derived object-valued payload used to prove consumers can safely render structured values. */
export function buildDynamicDataDetails(sourceState: IDynamicDataSourceState): IDynamicDataDetails {
  return {
    category: sourceState.sourceCategory,
    count: sourceState.sourceCount,
    emphasis: sourceState.sourceEmphasis,
    pvDepth: 1,
    metadata: {
      categoryLength: sourceState.sourceCategory.length,
      emphasisUppercase: sourceState.sourceEmphasis.toUpperCase(),
      pvDepth: 2,
      metrics: {
        countSquared: sourceState.sourceCount * sourceState.sourceCount,
        textLength: sourceState.sourceText.length,
        pvDepth: 3,
      },
    },
    summary: `${sourceState.sourceText} (${sourceState.sourceCount})`,
  };
}
