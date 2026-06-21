import { DynamicProperty } from '@microsoft/sp-component-base';

/** Object-valued property exposed by the dynamic-data source sample. */
export interface IDynamicDataDetails {
  category: string;
  count: number;
  emphasis: string;
  pvDepth: number;
  metadata: {
    categoryLength: number;
    emphasisUppercase: string;
    pvDepth: number;
    metrics: {
      countSquared: number;
      textLength: number;
      pvDepth: number;
    };
  };
  summary: string;
}

/** Source-side values that feed the dynamic-data property definitions. */
export interface IDynamicDataSourceState {
  sourceCategory: string;
  sourceCount: number;
  sourceEmphasis: string;
  sourceText: string;
}

/** Persisted state that drives the consumer-side connection-oriented conditional group. */
export interface IDynamicDataConsumerConnectionState {
  connectedDisplayMode: string;
  connectedSourceNote: string;
  lastConditionalAction?: string;
  manualConnectionLabel: string;
  showConnectedConfiguration: boolean;
}

/** Shape SPFx can deserialize into the property bag before the sample reconstructs DynamicProperty instances. */
export type DynamicPropertyLike<TValue> =
  | DynamicProperty<TValue>
  | { reference?: string; value?: TValue }
  | undefined;

/** Serializable shape used by DynamicProperty when a live instance has not been reconstructed yet. */
export interface ISerializedDynamicPropertyState<TValue> {
  reference?: unknown;
  value?: TValue;
}
