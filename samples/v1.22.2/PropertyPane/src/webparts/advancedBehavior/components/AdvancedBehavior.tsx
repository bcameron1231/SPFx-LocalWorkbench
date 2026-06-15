import * as React from 'react';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';

export interface IAdvancedBehaviorProps {
  bufferedText: string;
  buttonValue: string;
  customValue: string;
  customFieldStatus: string;
}

export default function AdvancedBehavior(props: IAdvancedBehaviorProps): React.ReactElement<IAdvancedBehaviorProps> {
  const sections: IScenarioDetailSection[] = [
    {
      title: 'Buffered Updates',
      entries: [
        { label: 'bufferedText', value: props.bufferedText },
        { label: 'buttonValue', value: props.buttonValue },
      ],
    },
    {
      title: 'Custom Field',
      entries: [
        { label: 'customValue', value: props.customValue },
        { label: 'customFieldStatus', value: props.customFieldStatus },
      ],
    },
  ];

  return (
    <ScenarioDetails
      title="Advanced Property Pane Behavior"
      description="Non-reactive updates, bound-value button mutation, and custom field callbacks."
      sections={sections}
    />
  );
}
