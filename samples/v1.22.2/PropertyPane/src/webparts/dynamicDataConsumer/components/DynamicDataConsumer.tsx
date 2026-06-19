import * as React from 'react';
import type { IManifestMetadata } from '../../shared/components/ManifestMetadataBadge';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';

export interface IDynamicDataConsumerProps {
  connectedDisplayMode: string;
  connectedPreviewValue: string;
  connectedSourceNote: string;
  dynamicTextValue: string;
  dynamicCountValue: string;
  dynamicSummaryValue: string;
  dynamicDetailsValue: string;
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
        { label: 'dynamicText', value: props.dynamicTextValue },
        { label: 'dynamicCount', value: props.dynamicCountValue },
        { label: 'dynamicSummary', value: props.dynamicSummaryValue },
        { label: 'dynamicDetails', value: props.dynamicDetailsValue },
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
