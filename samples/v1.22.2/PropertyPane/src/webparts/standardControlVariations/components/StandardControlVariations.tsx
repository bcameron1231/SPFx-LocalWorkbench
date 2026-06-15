import * as React from 'react';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';

export interface IStandardControlVariationsProps {
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

export default function StandardControlVariations(
  props: IStandardControlVariationsProps,
): React.ReactElement<IStandardControlVariationsProps> {
  const sections: IScenarioDetailSection[] = [
    {
      title: 'Text Field Variations',
      entries: [
        { label: 'ariaPlaceholderText', value: props.ariaPlaceholderText || '(empty)' },
        { label: 'fallbackValueText', value: props.fallbackValueText ?? '(unset)' },
        { label: 'readOnlyValue', value: props.readOnlyValue },
        { label: 'underlinedValue', value: props.underlinedValue },
        { label: 'disabledValue', value: props.disabledValue },
        { label: 'limitedLengthValue', value: props.limitedLengthValue },
        { label: 'multilineStaticValue', value: props.multilineStaticValue },
        { label: 'multilineResizableValue', value: props.multilineResizableValue },
      ],
    },
    {
      title: 'Toggle Variations',
      entries: [
        { label: 'toggleTextValue', value: String(props.toggleTextValue) },
        { label: 'toggleInlineLabelValue', value: String(props.toggleInlineLabelValue) },
        { label: 'toggleInlineLabelTextValue', value: String(props.toggleInlineLabelTextValue) },
        { label: 'toggleAriaLabelOnlyValue', value: String(props.toggleAriaLabelOnlyValue) },
        { label: 'toggleStateAriaLabelValue', value: String(props.toggleStateAriaLabelValue) },
        { label: 'toggleDisabledValue', value: String(props.toggleDisabledValue) },
      ],
    },
    {
      title: 'Checkbox Variations',
      entries: [
        { label: 'checkboxValue', value: String(props.checkboxValue) },
        { label: 'checkboxAriaLabelValue', value: String(props.checkboxAriaLabelValue) },
        { label: 'checkboxDisabledValue', value: String(props.checkboxDisabledValue) },
      ],
    },
    {
      title: 'Choice Group Variations',
      entries: [
        { label: 'choiceGroupValue', value: props.choiceGroupValue },
        { label: 'choiceGroupIconValue', value: props.choiceGroupIconValue },
        { label: 'choiceGroupImageValue', value: props.choiceGroupImageValue },
        { label: 'choiceGroupDisabledOptionValue', value: props.choiceGroupDisabledOptionValue },
      ],
    },
    {
      title: 'Dropdown Variations',
      entries: [
        { label: 'dropdownValue', value: props.dropdownValue },
        { label: 'dropdownAriaValue', value: props.dropdownAriaValue },
        { label: 'dropdownGroupedValue', value: String(props.dropdownGroupedValue) },
        { label: 'dropdownAnimalValue', value: props.dropdownAnimalValue },
        { label: 'dropdownDisabledValue', value: props.dropdownDisabledValue },
      ],
    },
    {
      title: 'Slider Variations',
      entries: [
        { label: 'sliderValue', value: String(props.sliderValue) },
        { label: 'sliderHiddenValue', value: String(props.sliderHiddenValue) },
      ],
    },
    {
      title: 'Button Variations',
      entries: [
        { label: 'buttonValue', value: props.buttonValue },
      ],
    },
    {
      title: 'Label Variations',
      entries: [
        { label: 'labelIntro', value: 'Display-only instructional text' },
        { label: 'labelStatus', value: 'Static guidance without a bound value' },
      ],
    },
    {
      title: 'Link Variations',
      entries: [
        { label: 'linkDocumentation', value: 'https://aka.ms/spfx' },
        { label: 'linkPopup', value: 'Popup window: 480x320, left bottom' },
        { label: 'linkDisabled', value: 'Disabled link sample' },
      ],
    },
  ];

  return (
    <ScenarioDetails
      title="Standard Control Variations"
      description="Built-in PropertyPane field variations grouped by standard control type."
      sections={sections}
    />
  );
}
