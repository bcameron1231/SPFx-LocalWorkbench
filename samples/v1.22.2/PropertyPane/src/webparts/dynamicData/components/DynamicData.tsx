import * as React from 'react';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';

export interface IDynamicDataProps {
  connectedDisplayMode: string;
  connectedSourceNote: string;
  sourceText: string;
  sourceCount: number;
  dynamicTextValue: string;
  dynamicCountValue: string;
  dynamicSummaryValue: string;
  lastConditionalAction: string;
  manualConnectionLabel: string;
  showConnectedConfiguration: boolean;
}

export default function DynamicData(props: IDynamicDataProps): React.ReactElement<IDynamicDataProps> {
  const sections: IScenarioDetailSection[] = [
    {
      title: 'Source Values',
      entries: [
        { label: 'sourceText', value: props.sourceText },
        { label: 'sourceCount', value: String(props.sourceCount) },
      ],
    },
    {
      title: 'Dynamic Consumers',
      entries: [
        { label: 'dynamicText', value: props.dynamicTextValue },
        { label: 'dynamicCount', value: props.dynamicCountValue },
        { label: 'dynamicSummary', value: props.dynamicSummaryValue },
      ],
    },
    {
      title: 'Conditional Connection',
      entries: [
        { label: 'showConnectedConfiguration', value: String(props.showConnectedConfiguration) },
        { label: 'manualConnectionLabel', value: props.manualConnectionLabel },
        { label: 'connectedSourceNote', value: props.connectedSourceNote },
        { label: 'connectedDisplayMode', value: props.connectedDisplayMode },
        { label: 'lastConditionalAction', value: props.lastConditionalAction },
      ],
    },
  ];

  return (
    <ScenarioDetails
      title="Dynamic Data Property Pane"
      description="A source and consumer surface for dynamic fields, dynamic field sets, and connection-style conditional groups."
      sections={sections}
    />
  );
}
