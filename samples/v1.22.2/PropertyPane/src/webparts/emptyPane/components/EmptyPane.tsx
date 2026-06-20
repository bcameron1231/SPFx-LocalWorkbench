import * as React from 'react';
import type { IManifestMetadata } from '../../shared/components/ManifestMetadataBadge';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';

export interface IEmptyPaneProps {
  manifestInfo: IManifestMetadata;
}

export default function EmptyPane(props: IEmptyPaneProps): React.ReactElement<IEmptyPaneProps> {
  const sections: IScenarioDetailSection[] = [
    {
      title: 'Expected Behavior',
      entries: [
        {
          label: 'propertyPane',
          value: 'This web part intentionally exposes no sample-defined property pane fields.',
        },
        {
          label: 'rendering',
          value: 'Opening the pane should remain stable even though there are no real SPFx properties to edit.',
        },
      ],
    },
  ];

  return (
    <ScenarioDetails
      manifestInfo={props.manifestInfo}
      title="Empty Property Pane"
      description="A host-behavior sample for a web part whose property pane intentionally contains no sample-defined fields."
      sections={sections}
    />
  );
}
