import * as React from 'react';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';
import type { IStandardControlsProps } from './IStandardControlsProps';

export default class StandardControls extends React.Component<IStandardControlsProps> {
  public render(): React.ReactElement<IStandardControlsProps> {
    const { textField, toggle, checkbox, dropdown, slider, choiceGroup } = this.props;

    const sections: IScenarioDetailSection[] = [
      {
        title: 'Text & Toggle',
        entries: [
          { label: 'textField', value: textField },
          { label: 'toggle', value: String(toggle) },
          { label: 'checkbox', value: String(checkbox) },
        ]
      },
      {
        title: 'Selection',
        entries: [
          { label: 'dropdown', value: dropdown },
          { label: 'choiceGroup', value: choiceGroup },
          { label: 'slider', value: String(slider) },
        ]
      },
      {
        title: 'Display-only Controls',
        entries: [
          { label: 'label', value: 'This is a PropertyPaneLabel — read-only text in the pane.' },
          { label: 'horizontalRule', value: '(visual separator — no stored value)' },
          { label: 'link', value: 'SPFx Documentation → https://aka.ms/spfx' },
          { label: 'button', value: '(triggers action — no stored value)' },
        ]
      },
    ];

    return (
      <ScenarioDetails
        manifestInfo={this.props.manifestInfo}
        title="Standard Property Pane Controls"
        description="Baseline SPFx property pane controls with simple reactive updates."
        sections={sections}
      />
    );
  }
}
