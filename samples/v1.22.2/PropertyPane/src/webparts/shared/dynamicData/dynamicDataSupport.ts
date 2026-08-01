import { DynamicProperty } from '@microsoft/sp-component-base';
import {
  DynamicDataSharedDepth,
  type IPropertyPaneConditionalGroup,
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneDynamicField,
  PropertyPaneDynamicFieldSet,
  PropertyPaneTextField,
} from '@microsoft/sp-property-pane';

import {
  DYNAMIC_DATA_PROPERTY_IDS,
  DYNAMIC_DATA_SOURCE_COMPONENT_ID,
  buildDynamicDataDetails,
} from './constants';
import type {
  DynamicPropertyLike,
  IDynamicDataSourceState,
  ISerializedDynamicPropertyState,
} from './types';

export interface IDynamicDataConditionalGroupOptions {
  onShowPrimaryGroup: () => void;
  onShowSecondaryGroup: () => void;
  showSecondaryGroup: boolean;
}

/** Source-side property pane: keep it simple and focused on values published to consumers. */
export function buildDynamicDataSourcePropertyPaneConfiguration(): IPropertyPaneConfiguration {
  return {
    pages: [
      {
        header: {
          description:
            'Values configured here are published through the SPFx dynamic-data source contract.',
        },
        groups: [
          {
            groupName: 'Published Values',
            groupFields: [
              PropertyPaneTextField('sourceText', {
                label: 'Source Text',
                description: 'Published as the sample string property.',
              }),
              PropertyPaneTextField('sourceCategory', {
                label: 'Source Category',
                description:
                  'Included in the object-valued property to test structured consumer rendering.',
              }),
              PropertyPaneTextField('sourceEmphasis', {
                label: 'Source Emphasis',
                description:
                  'Additional object-only detail so structured values are easier to distinguish.',
              }),
              PropertyPaneDropdown('sourceCount', {
                label: 'Source Count',
                options: [
                  { key: 0, text: '0' },
                  { key: 1, text: '1' },
                  { key: 2, text: '2' },
                  { key: 3, text: '3' },
                  { key: 4, text: '4' },
                  { key: 5, text: '5' },
                ],
              }),
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Consumer-side property-pane surface used to exercise:
 * - one standalone dynamic field
 * - one filtered standalone field for object values
 * - one dynamic field set with shared source selection
 * - one connection-oriented conditional group
 */
export function buildDynamicDataConsumerPropertyPaneConfiguration(
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
          description:
            'Dynamic data consumer scenarios for standalone fields, field sets, filters, and shared source selection.',
        },
        displayGroupsAsAccordion: true,
        groups: [
          {
            groupName: 'Standalone Dynamic Fields',
            isCollapsed: true,
            groupFields: [
              PropertyPaneDynamicField('depthDefault', {
                label: 'Depth Default',
                sourcesLabel: 'Connect to a dynamic data source',
                propertyValueDepth: 2,
              }),
              PropertyPaneDynamicField('depthZero', {
                label: 'Depth Zero',
                propertyValueDepth: 0,
              }),
              PropertyPaneDynamicField('depthOne', {
                label: 'Depth One',
                propertyValueDepth: 1,
              }),
              PropertyPaneDynamicField('filteredToDetails', {
                label: 'Filtered To Details',
                filters: {
                  componentId: DYNAMIC_DATA_SOURCE_COMPONENT_ID,
                  propertyId: DYNAMIC_DATA_PROPERTY_IDS.details,
                },
                propertyValueDepth: 2,
              }),
            ],
          },
          {
            groupName: 'DynamicFieldSet: Default',
            isCollapsed: true,
            groupFields: [
              PropertyPaneDynamicFieldSet({
                label: '',
                fields: [
                  PropertyPaneDynamicField('fieldSetDefaultPrimary', {
                    label: 'Default Primary',
                  }),
                  PropertyPaneDynamicField('fieldSetDefaultSecondary', {
                    label: 'Default Secondary',
                  }),
                ],
              }),
            ],
          },
          {
            groupName: 'DynamicFieldSet: Shared Source',
            isCollapsed: true,
            groupFields: [
              PropertyPaneDynamicFieldSet({
                label: '',
                fields: [
                  PropertyPaneDynamicField('fieldSetSharedSourcePrimary', {
                    label: 'Shared Source Primary',
                  }),
                  PropertyPaneDynamicField('fieldSetSharedSourceSecondary', {
                    label: 'Shared Source Secondary',
                  }),
                ],
                sharedConfiguration: {
                  depth: DynamicDataSharedDepth.Source,
                  source: {
                    sourcesLabel: 'Source is shared for all the fields',
                  },
                },
              }),
            ],
          },
          {
            groupName: 'DynamicFieldSet: Shared Source Filtered',
            isCollapsed: true,
            groupFields: [
              PropertyPaneDynamicFieldSet({
                label: '',
                fields: [
                  PropertyPaneDynamicField('fieldSetSharedSourceFilteredPrimary', {
                    label: 'Shared Source Filtered Primary',
                  }),
                  PropertyPaneDynamicField('fieldSetSharedSourceFilteredSecondary', {
                    label: 'Shared Source Filtered Secondary',
                  }),
                ],
                sharedConfiguration: {
                  depth: DynamicDataSharedDepth.Source,
                  source: {
                    filters: {
                      componentId: DYNAMIC_DATA_SOURCE_COMPONENT_ID,
                    },
                    sourcesLabel: 'Source is shared but must be DDS',
                  },
                },
              }),
            ],
          },
          {
            groupName: 'DynamicFieldSet: Shared Prop',
            isCollapsed: true,
            groupFields: [
              PropertyPaneDynamicFieldSet({
                label: '',
                fields: [
                  PropertyPaneDynamicField('fieldSetSharedPropertyPrimary', {
                    label: 'Shared Property Primary',
                  }),
                  PropertyPaneDynamicField('fieldSetSharedPropertySecondary', {
                    label: 'Shared Property Secondary',
                  }),
                ],
                sharedConfiguration: {
                  depth: DynamicDataSharedDepth.Property,
                  source: {
                    sourcesLabel: 'Source & Property is shared for all the fields',
                  },
                },
              }),
            ],
          },
          {
            groupName: 'DynamicFieldSet: Shared Prop Filtered',
            isCollapsed: true,
            groupFields: [
              PropertyPaneDynamicFieldSet({
                label: '',
                fields: [
                  PropertyPaneDynamicField('fieldSetFilteredPropertyPrimary', {
                    label: 'Filtered Property Primary',
                  }),
                  PropertyPaneDynamicField('fieldSetFilteredPropertySecondary', {
                    label: 'Filtered Property Secondary',
                  }),
                ],
                sharedConfiguration: {
                  depth: DynamicDataSharedDepth.Property,
                  source: {
                    filters: {
                      componentId: DYNAMIC_DATA_SOURCE_COMPONENT_ID,
                    },
                    sourcesLabel: 'Source & Property is shared but must be DDS.details',
                  },
                  property: {
                    filters: {
                      propertyId: DYNAMIC_DATA_PROPERTY_IDS.details,
                    },
                  },
                },
              }),
            ],
          },
        ],
      },
      {
        header: {
          description:
            'Conditional groups in SPFx are used for connection-style alternate configuration.',
        },
        displayGroupsAsAccordion: true,
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
    case DYNAMIC_DATA_PROPERTY_IDS.text:
      return sourceState.sourceText;
    case DYNAMIC_DATA_PROPERTY_IDS.count:
      return sourceState.sourceCount;
    case DYNAMIC_DATA_PROPERTY_IDS.summary:
      return `${sourceState.sourceText} (${sourceState.sourceCount})`;
    case DYNAMIC_DATA_PROPERTY_IDS.pvDepth:
      return 0;
    case DYNAMIC_DATA_PROPERTY_IDS.details:
      return buildDynamicDataDetails(sourceState);
    default:
      return undefined;
  }
}

export function resolveDynamicDisplayValue(property: DynamicProperty<unknown> | undefined): string {
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

  const serializedProperty = (
    property as DynamicProperty<TValue> & {
      toJSON?: () => ISerializedDynamicPropertyState<TValue>;
    }
  ).toJSON?.();

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
export function formatDynamicValue(value: unknown): string {
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
