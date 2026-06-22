import * as React from 'react';
import type { IManifestMetadata } from '../../shared/components/ManifestMetadataBadge';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';

export interface IValidationAndFocusProps {
  customValidationStatus: string;
  customValidationValue: string;
  defaultFocusCandidate: string;
  focusTarget: string;
  immediateValidatedText: string;
  deferredValidatedText: string;
  directErrorValidatedText: string;
  manifestInfo: IManifestMetadata;
}

export default function ValidationAndFocus(props: IValidationAndFocusProps): React.ReactElement<IValidationAndFocusProps> {
  const sections: IScenarioDetailSection[] = [
    // {
    //   title: 'Focus',
    //   entries: [
    //     { label: 'defaultFocusCandidate', value: props.defaultFocusCandidate },
    //     { label: 'focusTarget', value: props.focusTarget },
    //   ],
    // },
    {
      title: 'Validation',
      entries: [
        { label: 'immediateValidatedText', value: props.immediateValidatedText },
        { label: 'deferredValidatedText', value: props.deferredValidatedText },
        { label: 'directErrorValidatedText', value: props.directErrorValidatedText },
        { label: 'customValidationValue', value: props.customValidationValue },
        { label: 'customValidationStatus', value: props.customValidationStatus },
      ],
    },
  ];

  return (
    <ScenarioDetails
      manifestInfo={props.manifestInfo}
      title="Validation And Focus Behavior"
      description="Focus behavior, validation timing, direct error messages, and reactive custom-field updates."
      sections={sections}
    />
  );
}
