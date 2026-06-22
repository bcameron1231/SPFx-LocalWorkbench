import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  PropertyPaneButton,
  PropertyPaneButtonType,
  PropertyPaneLabel,
  PropertyPaneTextField,
  type IPropertyPaneConfiguration,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import AdvancedBehavior, { type IAdvancedBehaviorProps } from './components/AdvancedBehavior';
import { getManifestMetadata } from '../shared/components/ManifestMetadataBadge';
import { CustomValidationField } from '../shared/customValidationFieldSupport';

export interface IAdvancedBehaviorWebPartProps {
  bufferedText: string;
  buttonValue: string;
  customValue: string;
  customFieldStatus: string;
}

export default class AdvancedBehaviorWebPart extends BaseClientSideWebPart<IAdvancedBehaviorWebPartProps> {
  protected get disableReactivePropertyChanges(): boolean {
    return true;
  }

  public render(): void {
    const element: React.ReactElement<IAdvancedBehaviorProps> = React.createElement(AdvancedBehavior, {
      bufferedText: this.properties.bufferedText,
      buttonValue: this.properties.buttonValue,
      customValue: this.properties.customValue,
      customFieldStatus: this.properties.customFieldStatus,
      manifestInfo: getManifestMetadata(this.context.manifest),
    });

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
          header: { description: 'Non-reactive updates, button mutation, and custom field lifecycle.' },
          groups: [
            {
              groupName: 'Buffered Updates',
              groupFields: [
                PropertyPaneTextField('bufferedText', {
                  label: 'Buffered Text',
                  description: 'Changes should wait for Apply before updating the web part.',
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Append "!" to Button Value',
                  buttonType: PropertyPaneButtonType.Normal,
                  onClick: (value: unknown) => `${typeof value === 'string' ? value : ''}!`,
                }),
              ],
            },
            {
              groupName: 'Custom Field',
              groupFields: [
                PropertyPaneLabel('customFieldLabel', {
                  text: 'The custom field updates customValue and customFieldStatus through changeCallback.',
                }),
                CustomValidationField('customValue', {
                  context: {
                    description: 'Enter at least 3 characters to mark the value as valid.',
                  },
                  fieldKey: 'advancedBehaviorCustomValidationField',
                  initialValue: this.properties.customValue ?? '',
                  statusTargetProperty: 'customFieldStatus',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
