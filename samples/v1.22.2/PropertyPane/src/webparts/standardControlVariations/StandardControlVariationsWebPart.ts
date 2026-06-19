import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  PropertyPaneButton,
  PropertyPaneButtonType,
  PropertyPaneCheckbox,
  PropertyPaneChoiceGroup,
  PropertyPaneDropdown,
  PropertyPaneDropdownOptionType,
  PropertyPaneLabel,
  PropertyPaneLink,
  PopupWindowPosition,
  PropertyPaneSlider,
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
import { getManifestMetadata } from '../shared/components/ManifestMetadataBadge';

export interface IStandardControlVariationsWebPartProps {
  ariaPlaceholderText: string;
  buttonValue: string;
  checkboxAriaLabelValue: boolean;
  checkboxDisabledValue: boolean;
  checkboxValue: boolean;
  choiceGroupDisabledOptionValue: string;
  choiceGroupImageValue: string;
  choiceGroupIconValue: string;
  choiceGroupValue: string;
  disabledValue: string;
  dropdownAriaValue: string;
  dropdownAnimalValue: string;
  dropdownDisabledValue: string;
  dropdownGroupedValue: string | number;
  dropdownValue: string;
  fallbackValueText?: string;
  limitedLengthValue: string;
  multilineResizableValue: string;
  multilineStaticValue: string;
  readOnlyValue: string;
  sliderHiddenValue: number;
  sliderValue: number;
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
      buttonValue: this.properties.buttonValue,
      checkboxAriaLabelValue: this.properties.checkboxAriaLabelValue,
      checkboxDisabledValue: this.properties.checkboxDisabledValue,
      checkboxValue: this.properties.checkboxValue,
      choiceGroupDisabledOptionValue: this.properties.choiceGroupDisabledOptionValue,
      choiceGroupImageValue: this.properties.choiceGroupImageValue,
      choiceGroupIconValue: this.properties.choiceGroupIconValue,
      choiceGroupValue: this.properties.choiceGroupValue,
      disabledValue: this.properties.disabledValue,
      dropdownAriaValue: this.properties.dropdownAriaValue,
      dropdownAnimalValue: this.properties.dropdownAnimalValue,
      dropdownDisabledValue: this.properties.dropdownDisabledValue,
      dropdownGroupedValue: this.properties.dropdownGroupedValue,
      dropdownValue: this.properties.dropdownValue,
      fallbackValueText: this.properties.fallbackValueText,
      limitedLengthValue: this.properties.limitedLengthValue,
      manifestInfo: getManifestMetadata(this.context.manifest),
      multilineResizableValue: this.properties.multilineResizableValue,
      multilineStaticValue: this.properties.multilineStaticValue,
      readOnlyValue: this.properties.readOnlyValue,
      sliderHiddenValue: this.properties.sliderHiddenValue,
      sliderValue: this.properties.sliderValue,
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
                  calloutProps: {
                    calloutMaxHeight: 100,
                  },
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
                PropertyPaneDropdown('dropdownAnimalValue', {
                  label: 'Dropdown With Callout Max Height',
                  calloutProps: {
                    calloutMaxHeight: 100,
                  },
                  options: [
                    { key: 'aardvark', text: 'Aardvark' },
                    { key: 'beaver', text: 'Beaver' },
                    { key: 'capybara', text: 'Capybara' },
                    { key: 'dolphin', text: 'Dolphin' },
                    { key: 'elephant', text: 'Elephant' },
                    { key: 'falcon', text: 'Falcon' },
                    { key: 'giraffe', text: 'Giraffe' },
                    { key: 'hedgehog', text: 'Hedgehog' },
                    { key: 'iguana', text: 'Iguana' },
                    { key: 'jellyfish', text: 'Jellyfish' },
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
            {
              groupName: 'Slider Variations',
              isCollapsed: true,
              groupFields: [
                PropertyPaneSlider('sliderValue', {
                  label: 'Standard Slider',
                  min: 0,
                  max: 10,
                  ariaLabel: 'Standard Slider, Wowee!',
                }),
                PropertyPaneSlider('sliderHiddenValue', {
                  label: 'Slider Without Value Display (step 10)',
                  min: 0,
                  max: 100,
                  step: 10,
                  showValue: false,
                }),
                PropertyPaneSlider('sliderValue', {
                  label: 'Disabled Slider',
                  min: 0,
                  max: 10,
                  disabled: true,
                }),
              ],
            },
            {
              groupName: 'Button Variations',
              isCollapsed: true,
              groupFields: [
                PropertyPaneButton('buttonValue', {
                  text: 'Append "!" To Button Value',
                  buttonType: PropertyPaneButtonType.Normal,
                  ariaLabel: 'Append an exclamation point to the current button value',
                  ariaDescription: 'Activates the normal button sample and mutates the bound property.',
                  onClick: (value: unknown) => `${typeof value === 'string' ? value : ''}!`,
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Disabled Normal Button',
                  buttonType: PropertyPaneButtonType.Normal,
                  disabled: true,
                  onClick: (value: unknown) => value,
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Reset Button Value',
                  buttonType: PropertyPaneButtonType.Primary,
                  ariaLabel: 'Reset the button value to Ready',
                  onClick: () => 'Ready',
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Disabled Primary Button',
                  buttonType: PropertyPaneButtonType.Primary,
                  disabled: true,
                  onClick: (value: unknown) => value,
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Hero Button',
                  buttonType: PropertyPaneButtonType.Hero,
                  icon: 'FavoriteStar',
                  ariaDescription: 'Sets the button value to Hero when activated.',
                  onClick: () => 'Hero',
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Disabled Hero Button',
                  buttonType: PropertyPaneButtonType.Hero,
                  icon: 'FavoriteStar',
                  disabled: true,
                  onClick: (value: unknown) => value,
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Compound Button',
                  buttonType: PropertyPaneButtonType.Compound,
                  description: 'Compound buttons include supporting description text.',
                  ariaLabel: 'Set the button value to Compound',
                  onClick: () => 'Compound',
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Disabled Compound Button',
                  buttonType: PropertyPaneButtonType.Compound,
                  description: 'Disabled compound button sample.',
                  disabled: true,
                  onClick: (value: unknown) => value,
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Command Button',
                  buttonType: PropertyPaneButtonType.Command,
                  icon: 'Settings',
                  ariaDescription: 'Sets the button value to Command.',
                  onClick: () => 'Command',
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Disabled Command Button',
                  buttonType: PropertyPaneButtonType.Command,
                  icon: 'Settings',
                  disabled: true,
                  onClick: (value: unknown) => value,
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Icon Button',
                  buttonType: PropertyPaneButtonType.Icon,
                  icon: 'Emoji2',
                  ariaLabel: 'Set the button value to Icon',
                  ariaDescription: 'Icon button sample for compact command-style actions.',
                  onClick: () => 'Icon',
                }),
                PropertyPaneButton('buttonValue', {
                  text: 'Disabled Icon Button',
                  buttonType: PropertyPaneButtonType.Icon,
                  icon: 'Emoji2',
                  disabled: true,
                  onClick: (value: unknown) => value,
                }),
              ],
            },
            {
              groupName: 'Label Variations',
              isCollapsed: true,
              groupFields: [
                PropertyPaneLabel('labelIntro', {
                  text: 'PropertyPaneLabel is display-only text that can explain nearby controls.',
                }),
                PropertyPaneLabel('labelStatus', {
                  text: 'Use labels when you need static guidance without a bound input value. This one is marked as required.',
                  required: true,
                }),
              ],
            },
            {
              groupName: 'Link Variations',
              isCollapsed: true,
              groupFields: [
                PropertyPaneLink('linkDocumentation', {
                  text: 'Open SPFx documentation',
                  href: 'https://aka.ms/spfx',
                  target: '_blank',
                  ariaLabel: 'Open SPFx Documentation in new window',
                }),
                PropertyPaneLink('linkPopup', {
                  text: 'Open SPFx docs in popup window',
                  href: 'https://aka.ms/spfx',
                  target: '_blank',
                  ariaLabel: 'Open SPFx Documentation in popup window',
                  popupWindowProps: {
                    title: 'SPFx Docs',
                    width: 480,
                    height: 320,
                    positionWindowPosition: PopupWindowPosition.leftBottom,
                  },
                }),
                PropertyPaneLink('linkDisabled', {
                  text: 'Disabled link',
                  href: 'https://aka.ms/spfx',
                  disabled: true,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
