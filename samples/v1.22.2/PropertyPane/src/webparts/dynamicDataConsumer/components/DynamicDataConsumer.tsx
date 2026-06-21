import * as React from 'react';
import type { IManifestMetadata } from '../../shared/components/ManifestMetadataBadge';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';

export interface IDynamicDataConsumerProps {
  connectedDisplayMode: string;
  connectedPreviewValue: string;
  connectedSourceNote: string;
  depthDefaultValue: string;
  depthOneValue: string;
  depthZeroValue: string;
  fieldSetDefaultPrimaryValue: string;
  fieldSetDefaultSecondaryValue: string;
  fieldSetFilteredPropertyPrimaryValue: string;
  fieldSetFilteredPropertySecondaryValue: string;
  fieldSetSharedPropertyPrimaryValue: string;
  fieldSetSharedPropertySecondaryValue: string;
  fieldSetSharedSourcePrimaryValue: string;
  fieldSetSharedSourceSecondaryValue: string;
  fieldSetSharedSourceFilteredPrimaryValue: string;
  fieldSetSharedSourceFilteredSecondaryValue: string;
  filteredToDetailsValue: string;
  lastConditionalAction: string;
  manifestInfo: IManifestMetadata;
  manualConnectionLabel: string;
  showConnectedConfiguration: boolean;
}

export default function DynamicDataConsumer(
  props: IDynamicDataConsumerProps,
): React.ReactElement<IDynamicDataConsumerProps> {
  const sections: IScenarioDetailSection[] = [
    {
      title: 'Dynamic Consumers',
      entries: [
        { label: 'depthDefault', value: props.depthDefaultValue },
        { label: 'depthZero', value: props.depthZeroValue },
        { label: 'depthOne', value: props.depthOneValue },
        { label: 'filteredToDetails', value: props.filteredToDetailsValue },
      ],
    },
    {
      title: 'Dynamic Field Set: Default',
      entries: [
        { label: 'fieldSetDefaultPrimary', value: props.fieldSetDefaultPrimaryValue },
        { label: 'fieldSetDefaultSecondary', value: props.fieldSetDefaultSecondaryValue },
      ],
    },
    {
      title: 'Dynamic Field Set: Shared Source',
      entries: [
        {
          label: 'fieldSetSharedSourcePrimary',
          value: props.fieldSetSharedSourcePrimaryValue,
        },
        {
          label: 'fieldSetSharedSourceSecondary',
          value: props.fieldSetSharedSourceSecondaryValue,
        },
      ],
    },
    {
      title: 'Dynamic Field Set: Shared Source Filtered',
      entries: [
        {
          label: 'fieldSetSharedSourceFilteredPrimary',
          value: props.fieldSetSharedSourceFilteredPrimaryValue,
        },
        {
          label: 'fieldSetSharedSourceFilteredSecondary',
          value: props.fieldSetSharedSourceFilteredSecondaryValue,
        },
      ],
    },
    {
      title: 'Dynamic Field Set: Shared Property',
      entries: [
        {
          label: 'fieldSetSharedPropertyPrimary',
          value: props.fieldSetSharedPropertyPrimaryValue,
        },
        {
          label: 'fieldSetSharedPropertySecondary',
          value: props.fieldSetSharedPropertySecondaryValue,
        },
      ],
    },
    {
      title: 'Dynamic Field Set: Shared Property Filtered',
      entries: [
        {
          label: 'fieldSetFilteredPropertyPrimary',
          value: props.fieldSetFilteredPropertyPrimaryValue,
        },
        {
          label: 'fieldSetFilteredPropertySecondary',
          value: props.fieldSetFilteredPropertySecondaryValue,
        },
      ],
    },
    {
      title: 'Conditional Connection',
      entries: [
        { label: 'showConnectedConfiguration', value: String(props.showConnectedConfiguration) },
        { label: 'manualConnectionLabel', value: props.manualConnectionLabel },
        { label: 'connectedSourceNote', value: props.connectedSourceNote },
        { label: 'connectedDisplayMode', value: props.connectedDisplayMode },
        { label: 'connectedPreviewValue', value: props.connectedPreviewValue },
        { label: 'lastConditionalAction', value: props.lastConditionalAction },
      ],
    },
  ];

  return (
    <ScenarioDetails
      manifestInfo={props.manifestInfo}
      title="Dynamic Data Consumer"
      description="A consumer-only surface for dynamic fields, dynamic field sets, filtered object connections, and connection-style conditional groups."
      sections={sections}
    />
  );
}
