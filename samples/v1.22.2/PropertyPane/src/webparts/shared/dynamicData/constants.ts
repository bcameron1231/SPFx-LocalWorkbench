import type { IDynamicDataPropertyDefinition } from '@microsoft/sp-dynamic-data';
import type { IDynamicDataDetails, IDynamicDataSourceState } from './types';

export const DYNAMIC_DATA_PROPERTY_IDS = {
  text: 'text',
  count: 'count',
  summary: 'summary',
  details: 'details',
} as const;

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
    summary: `${sourceState.sourceText} (${sourceState.sourceCount})`,
  };
}
