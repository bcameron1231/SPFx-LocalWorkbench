import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { PropertyPaneLabel, PropertyPaneTextField, type IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import type { IPropertyPaneField } from '@microsoft/sp-property-pane';
import type { IPropertyPaneTextFieldProps } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import ValidationAndFocus, { type IValidationAndFocusProps } from './components/ValidationAndFocus';
import { getManifestMetadata } from '../shared/components/ManifestMetadataBadge';
import { CustomValidationField } from '../shared/customValidationFieldSupport';

export interface IValidationAndFocusWebPartProps {
  customValidationStatus: string;
  customValidationValue: string;
  defaultFocusCandidate: string;
  focusTarget: string;
  immediateValidatedText: string;
  deferredValidatedText: string;
  directErrorValidatedText: string;
}

export default class ValidationAndFocusWebPart extends BaseClientSideWebPart<IValidationAndFocusWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IValidationAndFocusProps> = React.createElement(ValidationAndFocus, {
      customValidationStatus: this.properties.customValidationStatus,
      customValidationValue: this.properties.customValidationValue,
      defaultFocusCandidate: this.properties.defaultFocusCandidate,
      focusTarget: this.properties.focusTarget,
      immediateValidatedText: this.properties.immediateValidatedText,
      deferredValidatedText: this.properties.deferredValidatedText,
      directErrorValidatedText: this.properties.directErrorValidatedText,
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
          header: { description: 'Validation callbacks, timing options, and initial focus behavior.' },
          groups: [
            // Disabled for now: `shouldFocus` correctly wins initial focus, but then steals focus
            // back during later interactions. Keeping this exact repro in place for a bug report.
            // {
            //   groupName: 'Focus',
            //   groupFields: [
            //     PropertyPaneTextField('defaultFocusCandidate', {
            //       label: 'Default Focus Candidate',
            //       description: 'This first field would normally receive focus when the pane opens.',
            //     }),
            //     this._withInitialFocus(
            //       PropertyPaneTextField('focusTarget', {
            //         label: 'Should Focus Target',
            //         description: 'This field should receive initial focus even though it is not the first text field.',
            //       }),
            //     ),
            //   ],
            // },
            {
              groupName: 'Validation',
              groupFields: [
                PropertyPaneTextField('immediateValidatedText', {
                  label: 'Immediate Validation',
                  description: 'Validates immediately while typing. Spaces are not allowed.',
                  onGetErrorMessage: (value: string) => value.includes(' ') ? 'Spaces are not allowed.' : '',
                }),
                PropertyPaneTextField('deferredValidatedText', {
                  label: 'Deferred Validation (3 seconds)',
                  description: 'Requires at least 5 characters.',
                  deferredValidationTime: 3000,
                  onGetErrorMessage: (value: string) => value.trim().length >= 5 ? '' : 'Enter at least 5 characters.',
                }),
                PropertyPaneTextField('directErrorValidatedText', {
                  label: 'Direct Validation',
                  description: 'Shows errors using errorMessage (no !) - value goes through regardless.',
                  errorMessage: this.properties.directErrorValidatedText.includes('!') ? 'No exclamation points!' : '',
                }),
                PropertyPaneLabel('customValidationFieldLabel', {
                  text: 'This custom field demonstrates immediate changeCallback updates in reactive mode.',
                }),
                CustomValidationField('customValidationValue', {
                  context: {
                    description: 'Change callback applies immediately in reactive mode. (3+ characters)',
                  },
                  fieldKey: 'validationAndFocusCustomValidationField',
                  initialValue: this.properties.customValidationValue ?? '',
                  statusTargetProperty: 'customValidationStatus',
                }),
              ],
            },
          ],
        },
      ],
    };
  }

  private _withInitialFocus(
    field: IPropertyPaneField<IPropertyPaneTextFieldProps>,
  ): IPropertyPaneField<IPropertyPaneTextFieldProps> {
    field.shouldFocus = true;
    return field;
  }
}
