import { Separator, Text } from '@fluentui/react';
import React, { FC } from 'react';

import { PropertyPaneFieldType } from '@spfx-local-workbench/shared';

import styles from './PropertyPanePanel.module.css';
import {
  ButtonComponent,
  CheckboxComponent,
  ChoiceGroupComponent,
  CustomFieldComponent,
  DropdownComponent,
  HeadingComponent,
  LabelComponent,
  LinkComponent,
  SliderComponent,
  TextFieldComponent,
  ToggleComponent,
} from './components';
import {
  createButtonFieldViewModel,
  createCheckboxFieldViewModel,
  createChoiceGroupFieldViewModel,
  createDropdownFieldViewModel,
  createLinkFieldViewModel,
  createSliderFieldViewModel,
  createTextFieldViewModel,
  createTextOnlyFieldViewModel,
  createToggleFieldViewModel,
} from './shared';
import type { IPropertyPaneFieldModel } from './types';

interface IPropertyPaneFieldRendererProps {
  currentValue: unknown;
  field: IPropertyPaneFieldModel;
  locale: string;
  onPropertyChange: (targetProperty: string, newValue: unknown) => void;
}

export const PropertyPaneFieldRenderer: FC<IPropertyPaneFieldRendererProps> = ({
  currentValue,
  field,
  locale,
  onPropertyChange,
}) => {
  const handleChange = (newValue: unknown) => {
    if (field.targetProperty) {
      onPropertyChange(field.targetProperty, newValue);
    }
  };

  switch (field.type) {
    case PropertyPaneFieldType.TextField:
      return (
        <TextFieldComponent
          {...createTextFieldViewModel(field, locale)}
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.CheckBox:
      return (
        <CheckboxComponent
          {...createCheckboxFieldViewModel(field, locale)}
          checked={!!currentValue}
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.Toggle:
      return (
        <ToggleComponent
          {...createToggleFieldViewModel(field, locale)}
          checked={!!currentValue}
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.Dropdown:
      return (
        <DropdownComponent
          {...createDropdownFieldViewModel(field, locale)}
          selectedKey={
            typeof currentValue === 'string' || typeof currentValue === 'number'
              ? currentValue
              : undefined
          }
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.Slider: {
      const slider = createSliderFieldViewModel(field, locale);
      return (
        <SliderComponent
          {...slider}
          value={typeof currentValue === 'number' ? currentValue : slider.min}
          onChange={handleChange}
        />
      );
    }
    case PropertyPaneFieldType.ChoiceGroup:
      return (
        <ChoiceGroupComponent
          {...createChoiceGroupFieldViewModel(field, locale)}
          selectedKey={typeof currentValue === 'string' ? currentValue : undefined}
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.Button:
      return <ButtonComponent {...createButtonFieldViewModel(field, locale)} />;
    case PropertyPaneFieldType.Label:
      return <LabelComponent {...createTextOnlyFieldViewModel(field, locale)} />;
    case PropertyPaneFieldType.Heading:
      return <HeadingComponent {...createTextOnlyFieldViewModel(field, locale)} />;
    case PropertyPaneFieldType.Link:
      return <LinkComponent {...createLinkFieldViewModel(field, locale)} />;
    case PropertyPaneFieldType.HorizontalRule:
      return <Separator />;
    case PropertyPaneFieldType.Custom:
      return <CustomFieldComponent field={field} value={currentValue} onChange={handleChange} />;
    case PropertyPaneFieldType.DynamicField:
      return (
        <TextFieldComponent
          {...createTextFieldViewModel(field, locale)}
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.DynamicFieldSet:
      return <Text className={styles.empty}>Dynamic Field Set (Not fully supported)</Text>;
    default:
      return <Text className={styles.required}>Unsupported field type: {field.type}</Text>;
  }
};
