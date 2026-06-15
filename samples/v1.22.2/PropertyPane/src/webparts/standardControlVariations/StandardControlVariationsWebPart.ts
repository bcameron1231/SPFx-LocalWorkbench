import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  PropertyPaneCheckbox,
  PropertyPaneChoiceGroup,
  PropertyPaneDropdown,
  PropertyPaneDropdownOptionType,
  PropertyPaneTextField,
  PropertyPaneToggle,
  type IPropertyPaneConfiguration,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import {
  BANANAS_SELECTED_IMAGE_DATA_URL,
  BANANAS_UNSELECTED_IMAGE_DATA_URL,
  ORANGE_SELECTED_IMAGE_DATA_URL,
  ORANGE_UNSELECTED_IMAGE_DATA_URL,
  WATERMELON_SELECTED_IMAGE_DATA_URL,
  WATERMELON_UNSELECTED_IMAGE_DATA_URL,
} from './choiceGroupImageData';

import StandardControlVariations, {
  type IStandardControlVariationsProps,
} from './components/StandardControlVariations';

export interface IStandardControlVariationsWebPartProps {
  ariaPlaceholderText: string;
  checkboxAriaLabelValue: boolean;
  checkboxDisabledValue: boolean;
  checkboxValue: boolean;
  choiceGroupDisabledOptionValue: string;
  choiceGroupImageValue: string;
  choiceGroupIconValue: string;
  choiceGroupValue: string;
  disabledValue: string;
  dropdownAriaValue: string;
  dropdownDisabledValue: string;
  dropdownGroupedValue: string | number;
  dropdownValue: string;
  fallbackValueText?: string;
  limitedLengthValue: string;
  multilineResizableValue: string;
  multilineStaticValue: string;
  readOnlyValue: string;
  toggleAriaLabelOnlyValue: boolean;
  toggleDisabledValue: boolean;
  toggleInlineLabelTextValue: boolean;
  toggleInlineLabelValue: boolean;
  toggleStateAriaLabelValue: boolean;
  toggleTextValue: boolean;
  underlinedValue: string;
}

export default class StandardControlVariationsWebPart extends BaseClientSideWebPart<IStandardControlVariationsWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IStandardControlVariationsProps> = React.createElement(StandardControlVariations, {
      ariaPlaceholderText: this.properties.ariaPlaceholderText,
      checkboxAriaLabelValue: this.properties.checkboxAriaLabelValue,
      checkboxDisabledValue: this.properties.checkboxDisabledValue,
      checkboxValue: this.properties.checkboxValue,
      choiceGroupDisabledOptionValue: this.properties.choiceGroupDisabledOptionValue,
      choiceGroupImageValue: this.properties.choiceGroupImageValue,
      choiceGroupIconValue: this.properties.choiceGroupIconValue,
      choiceGroupValue: this.properties.choiceGroupValue,
      disabledValue: this.properties.disabledValue,
      dropdownAriaValue: this.properties.dropdownAriaValue,
      dropdownDisabledValue: this.properties.dropdownDisabledValue,
      dropdownGroupedValue: this.properties.dropdownGroupedValue,
      dropdownValue: this.properties.dropdownValue,
      fallbackValueText: this.properties.fallbackValueText,
      limitedLengthValue: this.properties.limitedLengthValue,
      multilineResizableValue: this.properties.multilineResizableValue,
      multilineStaticValue: this.properties.multilineStaticValue,
      readOnlyValue: this.properties.readOnlyValue,
      toggleAriaLabelOnlyValue: this.properties.toggleAriaLabelOnlyValue,
      toggleDisabledValue: this.properties.toggleDisabledValue,
      toggleInlineLabelTextValue: this.properties.toggleInlineLabelTextValue,
      toggleInlineLabelValue: this.properties.toggleInlineLabelValue,
      toggleStateAriaLabelValue: this.properties.toggleStateAriaLabelValue,
      toggleTextValue: this.properties.toggleTextValue,
      underlinedValue: this.properties.underlinedValue,
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
          displayGroupsAsAccordion: true,
          header: {
            description: 'Built-in property-pane control variations grouped by standard field type.',
          },
          groups: [
            {
              groupName: 'Text Field Variations',
              isCollapsed: true,
              groupFields: [
                PropertyPaneTextField('ariaPlaceholderText', {
                  label: 'Placeholder And Aria Label',
                  placeholder: 'Type to replace this placeholder',
                  ariaLabel: 'Placeholder and aria label sample text field',
                  description: 'Uses a placeholder plus explicit ariaLabel for accessibility testing.',
                }),
                PropertyPaneTextField('fallbackValueText', {
                  label: 'Value Fallback',
                  value: 'Fallback shown when the bound property is empty or null',
                  description: 'Tests the SPFx value fallback behavior for an unset property.',
                }),
                PropertyPaneTextField('readOnlyValue', {
                  label: 'Read-Only',
                  readOnly: true,
                }),
                PropertyPaneTextField('underlinedValue', {
                  label: 'Underlined',
                  underlined: true,
                }),
                PropertyPaneTextField('disabledValue', {
                  label: 'Disabled',
                  disabled: true,
                }),
                PropertyPaneTextField('limitedLengthValue', {
                  label: 'Max Length (10)',
                  description: 'Limits input to 10 characters so the behavior is easy to spot.',
                  maxLength: 10,
                }),
                PropertyPaneTextField('multilineStaticValue', {
                  label: 'Multiline',
                  multiline: true,
                  rows: 4,
                  resizable: false,
                  maxLength: 200,
                }),
                PropertyPaneTextField('multilineResizableValue', {
                  label: 'Multiline Resizable',
                  multiline: true,
                  rows: 4,
                  maxLength: 200,
                }),
              ],
            },
            {
              groupName: 'Toggle Variations',
              isCollapsed: true,
              groupFields: [
                PropertyPaneToggle('toggleTextValue', {
                  label: 'Toggle With On/Off Text',
                  onText: 'Enabled',
                  offText: 'Disabled',
                }),
                PropertyPaneToggle('toggleInlineLabelValue', {
                  label: 'Inline Label Toggle',
                  inlineLabel: true,
                }),
                PropertyPaneToggle('toggleInlineLabelTextValue', {
                  label: 'Inline Label Toggle With Text',
                  inlineLabel: true,
                  onText: 'On',
                  offText: 'Off',
                }),
                PropertyPaneToggle('toggleAriaLabelOnlyValue', {
                  label: 'Aria Label Only Toggle',
                  onText: 'Enabled',
                  offText: 'Disabled',
                  ariaLabel: 'Aria label only toggle variation',
                }),
                PropertyPaneToggle('toggleStateAriaLabelValue', {
                  label: 'State Aria Label Toggle',
                  onText: 'Available',
                  offText: 'Unavailable',
                  onAriaLabel: 'State aria label toggle is on',
                  offAriaLabel: 'State aria label toggle is off',
                }),
                PropertyPaneToggle('toggleDisabledValue', {
                  label: 'Disabled Toggle',
                  onText: 'Locked On',
                  offText: 'Locked Off',
                  disabled: true,
                }),
              ],
            },
            {
              groupName: 'Checkbox Variations',
              isCollapsed: true,
              groupFields: [
                PropertyPaneCheckbox('checkboxValue', {
                  text: 'Standard Checkbox',
                }),
                PropertyPaneCheckbox('checkboxAriaLabelValue', {
                  text: 'Checkbox With Aria Label',
                  ariaLabel: 'Checkbox with explicit aria label variation',
                }),
                PropertyPaneCheckbox('checkboxDisabledValue', {
                  text: 'Disabled Checkbox',
                  disabled: true,
                }),
              ],
            },
            {
              groupName: 'Choice Group Variations',
              isCollapsed: true,
              groupFields: [
                PropertyPaneChoiceGroup('choiceGroupValue', {
                  label: 'Standard Choice Group (with ariaLabels)',
                  options: [
                    { key: 'alpha', text: 'Alpha', ariaLabel: 'Alpha option' },
                    { key: 'beta', text: 'Beta', ariaLabel: 'Beta option' },
                    { key: 'gamma', text: 'Gamma', ariaLabel: 'Gamma option' },
                  ],
                }),
                PropertyPaneChoiceGroup('choiceGroupIconValue', {
                  label: 'Choice Group With Icons (with ariaLabels)',
                  options: [
                    { key: 'sun', text: 'Sun', iconProps: { officeFabricIconFontName: 'Sunny' }, ariaLabel: 'Sunny option' },
                    { key: 'rain', text: 'Rain', iconProps: { officeFabricIconFontName: 'Rain' }, ariaLabel: 'Rain option' },
                    { key: 'cloud', text: 'Cloud', iconProps: { officeFabricIconFontName: 'Cloud' }, ariaLabel: 'Cloud option' },
                  ],
                }),
                PropertyPaneChoiceGroup('choiceGroupImageValue', {
                  label: 'Choice Group With Images',
                  options: [
                    {
                      key: 'bananas',
                      text: 'Bananas',
                      imageSrc: BANANAS_UNSELECTED_IMAGE_DATA_URL,
                      selectedImageSrc: BANANAS_SELECTED_IMAGE_DATA_URL,
                      imageAlt: 'Bananas choice image',
                      imageSize: { width: 64, height: 64 },
                    },
                    {
                      key: 'orange',
                      text: 'Orange',
                      imageSrc: ORANGE_UNSELECTED_IMAGE_DATA_URL,
                      selectedImageSrc: ORANGE_SELECTED_IMAGE_DATA_URL,
                      imageAlt: 'Orange choice image',
                      imageSize: { width: 64, height: 64 },
                    },
                    {
                      key: 'watermelon',
                      text: 'Watermelon',
                      imageSrc: WATERMELON_UNSELECTED_IMAGE_DATA_URL,
                      selectedImageSrc: WATERMELON_SELECTED_IMAGE_DATA_URL,
                      imageAlt: 'Watermelon choice image',
                      imageSize: { width: 64, height: 64 },
                    },
                  ],
                }),
                PropertyPaneChoiceGroup('choiceGroupDisabledOptionValue', {
                  label: 'Choice Group With Disabled Option',
                  options: [
                    { key: 'available', text: 'Available' },
                    { key: 'locked', text: 'Locked', disabled: true },
                    { key: 'pending', text: 'Pending' },
                  ],
                }),
              ],
            },
            {
              groupName: 'Dropdown Variations',
              isCollapsed: true,
              groupFields: [
                PropertyPaneDropdown('dropdownValue', {
                  label: 'Standard Dropdown',
                  options: [
                    { key: 'red', text: 'Red' },
                    { key: 'green', text: 'Green' },
                    { key: 'blue', text: 'Blue' },
                  ],
                }),
                PropertyPaneDropdown('dropdownAriaValue', {
                  label: 'Dropdown With Aria Labels',
                  ariaLabel: 'Dropdown with explicit aria label variation',
                  ariaDescription: 'Use arrow keys to move through the color choices.',
                  options: [
                    { key: 'small', text: 'Small' },
                    { key: 'medium', text: 'Medium' },
                    { key: 'large', text: 'Large' },
                  ],
                }),
                PropertyPaneDropdown('dropdownGroupedValue', {
                  label: 'Dropdown With Option Types',
                  options: [
                    { key: 'header-1', text: 'Status', type: PropertyPaneDropdownOptionType.Header, index: 0 },
                    { key: 'draft', text: 'Draft', index: 1 },
                    { key: 'review', text: 'In Review', index: 2 },
                    { key: 'divider-1', text: '-', type: PropertyPaneDropdownOptionType.Divider, index: 3 },
                    { key: 'header-2', text: 'Visibility', type: PropertyPaneDropdownOptionType.Header, index: 4 },
                    { key: 'private', text: 'Private', index: 5 },
                    { key: 'public', text: 'Public', index: 6 },
                  ],
                }),
                PropertyPaneDropdown('dropdownDisabledValue', {
                  label: 'Disabled Dropdown',
                  disabled: true,
                  options: [
                    { key: 'locked-a', text: 'Locked A' },
                    { key: 'locked-b', text: 'Locked B' },
                  ],
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
