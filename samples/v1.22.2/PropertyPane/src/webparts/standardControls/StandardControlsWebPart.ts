import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneCheckbox,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneChoiceGroup,
  PropertyPaneLabel,
  PropertyPaneLink,
  PropertyPaneHorizontalRule,
  PropertyPaneButton,
  PropertyPaneButtonType
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import StandardControls from './components/StandardControls';
import { IStandardControlsProps } from './components/IStandardControlsProps';

export interface IStandardControlsWebPartProps {
  textField: string;
  toggle: boolean;
  checkbox: boolean;
  dropdown: string;
  slider: number;
  choiceGroup: string;
}

export default class StandardControlsWebPart extends BaseClientSideWebPart<IStandardControlsWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IStandardControlsProps> = React.createElement(
      StandardControls,
      {
        textField: this.properties.textField,
        toggle: this.properties.toggle,
        checkbox: this.properties.checkbox,
        dropdown: this.properties.dropdown,
        slider: this.properties.slider,
        choiceGroup: this.properties.choiceGroup
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Standard Property Pane Controls Demo' },
          groups: [
            {
              groupName: 'Text & Toggle',
              groupFields: [
                PropertyPaneTextField('textField', {
                  label: 'Text Field',
                  description: 'A standard single-line text input'
                }),
                PropertyPaneToggle('toggle', {
                  label: 'Toggle',
                  onText: 'On',
                  offText: 'Off'
                }),
                PropertyPaneCheckbox('checkbox', {
                  text: 'Checkbox'
                })
              ]
            },
            {
              groupName: 'Selection',
              groupFields: [
                PropertyPaneDropdown('dropdown', {
                  label: 'Dropdown',
                  options: [
                    { key: 'option1', text: 'Option 1' },
                    { key: 'option2', text: 'Option 2' },
                    { key: 'option3', text: 'Option 3' }
                  ]
                }),
                PropertyPaneChoiceGroup('choiceGroup', {
                  label: 'Choice Group',
                  options: [
                    { key: 'A', text: 'Choice A' },
                    { key: 'B', text: 'Choice B' },
                    { key: 'C', text: 'Choice C' }
                  ]
                }),
                PropertyPaneSlider('slider', {
                  label: 'Slider',
                  min: 0,
                  max: 10,
                  step: 1,
                  showValue: true
                })
              ]
            },
            {
              groupName: 'Display-only Controls',
              groupFields: [
                PropertyPaneLabel('label', {
                  text: 'This is a PropertyPaneLabel — read-only text in the pane.'
                }),
                PropertyPaneHorizontalRule(),
                PropertyPaneLink('link', {
                  text: 'SPFx Documentation',
                  href: 'https://aka.ms/spfx',
                  target: '_blank'
                }),
                PropertyPaneButton('button', {
                  text: 'Click Me',
                  buttonType: PropertyPaneButtonType.Normal,
                  onClick: () => alert('PropertyPaneButton clicked!')
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
