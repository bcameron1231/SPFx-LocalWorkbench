import {
  DynamicDataSharedDepth,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneDynamicField,
  PropertyPaneDynamicFieldSet,
  type IPropertyPaneConditionalGroup,
  PropertyPaneSlider,
  type IPropertyPaneConfiguration,
} from '@microsoft/sp-property-pane';
import { DynamicProperty } from '@microsoft/sp-component-base';
import type { IDynamicDataPropertyDefinition } from '@microsoft/sp-dynamic-data';

export interface IDynamicDataSourceState {
  sourceCount: number;
  sourceText: string;
}

export interface IDynamicDataConditionalGroupOptions {
  onShowPrimaryGroup: () => void;
  onShowSecondaryGroup: () => void;
  showSecondaryGroup: boolean;
}

/**
 * Shape we expect when SPFx deserializes persisted dynamic-property state back into the property bag.
 */
export type DynamicPropertyLike<TValue> =
  | DynamicProperty<TValue>
  | { reference?: string; value?: TValue }
  | undefined;

interface ISerializedDynamicPropertyState<TValue> {
  reference?: unknown;
  value?: TValue;
}

/**
 * Source properties exposed by the sample web part.
 * These definitions are part of the SPFx dynamic-data contract, not just sample display data.
 */
export const DYNAMIC_DATA_PROPERTY_DEFINITIONS: ReadonlyArray<IDynamicDataPropertyDefinition> = [
  {
    id: 'text',
    title: 'Source Text',
  },
  {
    id: 'count',
    title: 'Source Count',
  },
  {
    id: 'summary',
    title: 'Source Summary',
  },
];

/**
 * Property-pane surface used to exercise:
 * - one standalone dynamic field
 * - one dynamic field set with shared source selection
 */
export function buildDynamicDataPropertyPaneConfiguration(
  conditionalGroupOptions: IDynamicDataConditionalGroupOptions,
): IPropertyPaneConfiguration {
  const conditionalGroup: IPropertyPaneConditionalGroup = {
    primaryGroup: {
      groupName: 'Manual Configuration',
      groupFields: [
        PropertyPaneTextField('manualConnectionLabel', {
          label: 'Manual Connection Label',
          description: 'Used when the sample is not in the connected configuration state.',
        }),
      ],
    },
    secondaryGroup: {
      groupName: 'Connected Configuration',
      groupFields: [
        PropertyPaneTextField('connectedSourceNote', {
          label: 'Connected Source Note',
          description: 'A persisted note for the connected configuration path.',
        }),
        PropertyPaneDropdown('connectedDisplayMode', {
          label: 'Connected Display Mode',
          options: [
            { key: 'summary', text: 'Summary' },
            { key: 'textOnly', text: 'Text Only' },
            { key: 'countOnly', text: 'Count Only' },
          ],
        }),
      ],
    },
    onShowPrimaryGroup: conditionalGroupOptions.onShowPrimaryGroup,
    onShowSecondaryGroup: conditionalGroupOptions.onShowSecondaryGroup,
    showSecondaryGroup: conditionalGroupOptions.showSecondaryGroup,
  };

  return {
    pages: [
      {
        header: {
          description: 'Source values plus dynamic field and dynamic field set consumers.',
        },
        groups: [
          {
            groupName: 'Source',
            groupFields: [
              PropertyPaneTextField('sourceText', {
                label: 'Source Text',
                description: 'Published through this web part as dynamic data.',
              }),
              PropertyPaneSlider('sourceCount', {
                label: 'Source Count',
                min: 0,
                max: 10,
                step: 1,
                showValue: true,
              }),
            ],
          },
          {
            groupName: 'Connections',
            groupFields: [
              PropertyPaneDynamicField('dynamicText', {
                label: 'Dynamic Text',
                sourcesLabel: 'Connect to a sample source',
                propertyValueDepth: 1,
              }),
              PropertyPaneDynamicFieldSet({
                label: 'Dynamic Field Set',
                fields: [
                  PropertyPaneDynamicField('dynamicCount', {
                    label: 'Dynamic Count',
                    filters: { propertyId: 'count' },
                    propertyValueDepth: 0,
                  }),
                  PropertyPaneDynamicField('dynamicSummary', {
                    label: 'Dynamic Summary',
                    propertyValueDepth: 1,
                  }),
                ],
                sharedConfiguration: {
                  depth: DynamicDataSharedDepth.Source,
                },
              }),
            ],
          },
        ],
      },
      {
        header: {
          description: 'Conditional groups in SPFx are used for connection-style alternate configuration.',
        },
        groups: [conditionalGroup],
      },
    ],
  };
}

/**
 * SPFx persists dynamic properties as serializable data and recreates them during load.
 * This helper makes the sample tolerant of either a real DynamicProperty instance or
 * the serialized shape used before reconstruction.
 */
export function ensureDynamicProperty<TValue>(
  property: DynamicPropertyLike<TValue>,
  provider: unknown,
  onChange: () => void,
): DynamicProperty<TValue> {
  if (property instanceof DynamicProperty) {
    return property;
  }

  const dynamicProperty = new DynamicProperty<TValue>(provider as never, onChange);

  if (property?.reference) {
    dynamicProperty.setReference(property.reference);
  } else if (Object.prototype.hasOwnProperty.call(property ?? {}, 'value')) {
    dynamicProperty.setValue(property?.value as TValue);
  }

  return dynamicProperty;
}

/**
 * Returns live source values for the sample's exposed dynamic-data properties.
 */
export function getDynamicDataPropertyValue(
  sourceState: IDynamicDataSourceState,
  propertyId: string,
): unknown {
  switch (propertyId) {
    case 'text':
      return sourceState.sourceText;
    case 'count':
      return sourceState.sourceCount;
    case 'summary':
      return `${sourceState.sourceText} (${sourceState.sourceCount})`;
    default:
      return undefined;
  }
}

export function resolveDynamicDisplayValue(
  property: DynamicProperty<unknown> | undefined,
): string {
  return formatDynamicValue(tryReadDynamicValue(property));
}

export function resolveDynamicNumberDisplayValue(
  property: DynamicProperty<number> | undefined,
): string {
  const value = tryReadDynamicValue(property);
  return value !== undefined ? String(value) : '(not connected)';
}

/**
 * Online workbench can surface partially initialized DynamicProperty instances while authors
 * are configuring connections. We inspect the serializable shape first so the sample can
 * render safely instead of crashing during those intermediate states.
 */
function tryReadDynamicValue<TValue>(
  property: DynamicProperty<TValue> | undefined,
): TValue | undefined {
  if (!property) {
    return undefined;
  }

  const serializedProperty = (property as DynamicProperty<TValue> & {
    toJSON?: () => ISerializedDynamicPropertyState<TValue>;
  }).toJSON?.();

  if (!serializedProperty) {
    return undefined;
  }

  if (serializedProperty.reference === undefined && serializedProperty.value === undefined) {
    return undefined;
  }

  try {
    return property.tryGetValue();
  } catch {
    return serializedProperty.value;
  }
}

/**
 * Display helper only. This is not part of the dynamic-data contract itself.
 */
function formatDynamicValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '(not connected)';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}
