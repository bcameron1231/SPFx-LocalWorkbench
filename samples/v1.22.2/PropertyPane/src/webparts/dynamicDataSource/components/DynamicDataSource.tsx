import * as React from 'react';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';

export interface IDynamicDataSourceProps {
  sourceCategory: string;
  sourceCount: number;
  sourceDetailsValue: string;
  sourceEmphasis: string;
  sourceSummary: string;
  sourceText: string;
}

export default function DynamicDataSource(
  props: IDynamicDataSourceProps,
): React.ReactElement<IDynamicDataSourceProps> {
  const sections: IScenarioDetailSection[] = [
    {
      title: 'Published Dynamic Properties',
      entries: [
        { label: 'text', value: props.sourceText },
        { label: 'count', value: String(props.sourceCount) },
        { label: 'summary', value: props.sourceSummary },
        { label: 'details', value: props.sourceDetailsValue },
      ],
    },
    {
      title: 'Source Inputs',
      entries: [
        { label: 'sourceCategory', value: props.sourceCategory },
        { label: 'sourceEmphasis', value: props.sourceEmphasis },
      ],
    },
  ];

  return (
    <ScenarioDetails
      title="Dynamic Data Source"
      description="A source-only surface that publishes primitive and object-valued properties through the SPFx dynamic-data contract."
      sections={sections}
    />
  );
}
