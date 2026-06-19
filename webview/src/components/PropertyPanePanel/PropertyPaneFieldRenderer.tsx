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
  DynamicFieldComponent,
  DynamicFieldSetComponent,
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
  createDynamicFieldSetViewModel,
  createDynamicFieldViewModel,
  createLinkFieldViewModel,
  createSliderFieldViewModel,
  createTextFieldViewModel,
  createTextOnlyFieldViewModel,
  createToggleFieldViewModel,
  getDynamicDataSources,
  getDynamicPropertyReference,
  getDynamicPropertyValue,
} from './shared';
import type { IPropertyPaneFieldModel } from './types';

interface IPropertyPaneFieldRendererProps {
  autoFocus?: boolean;
  currentValue: unknown;
  field: IPropertyPaneFieldModel;
  getCurrentValue?: (targetProperty: string | undefined) => unknown;
  locale: string;
  onPropertyChange: (targetProperty: string, newValue: unknown) => void;
  provider?: unknown;
}

export const PropertyPaneFieldRenderer: FC<IPropertyPaneFieldRendererProps> = ({
  autoFocus,
  currentValue,
  field,
  getCurrentValue,
  locale,
  onPropertyChange,
  provider,
}) => {
  const handleChange = (newValue: unknown) => {
    if (field.targetProperty) {
      onPropertyChange(field.targetProperty, newValue);
    }
  };

  const wrapField = (node: React.ReactNode) => (
    <div className={styles.fieldWrapper}>{node}</div>
  );

  switch (field.type) {
    case PropertyPaneFieldType.TextField:
      return wrapField(
        <TextFieldComponent
          {...createTextFieldViewModel(field, locale)}
          autoFocus={autoFocus}
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.CheckBox:
      return wrapField(
        <CheckboxComponent
          {...createCheckboxFieldViewModel(field, locale)}
          checked={!!currentValue}
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.Toggle:
      return wrapField(
        <ToggleComponent
          {...createToggleFieldViewModel(field, locale)}
          checked={!!currentValue}
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.Dropdown:
      return wrapField(
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
      return wrapField(
        <SliderComponent
          {...slider}
          value={typeof currentValue === 'number' ? currentValue : slider.min}
          onChange={handleChange}
        />
      );
    }
    case PropertyPaneFieldType.ChoiceGroup: {
      const choiceGroup = createChoiceGroupFieldViewModel(field, locale);
      return wrapField(
        <ChoiceGroupComponent
          disabled={choiceGroup.disabled}
          label={choiceGroup.label}
          options={choiceGroup.options}
          selectedKey={typeof currentValue === 'string' ? currentValue : undefined}
          onChange={handleChange}
        />
      );
    }
    case PropertyPaneFieldType.Button:
      return wrapField(
        <ButtonComponent
          {...createButtonFieldViewModel(field, locale)}
          currentValue={currentValue}
          onChange={handleChange}
        />
      );
    case PropertyPaneFieldType.Label:
      return wrapField(<LabelComponent {...createTextOnlyFieldViewModel(field, locale)} />);
    case PropertyPaneFieldType.Heading:
      return wrapField(<HeadingComponent {...createTextOnlyFieldViewModel(field, locale)} />);
    case PropertyPaneFieldType.Link:
      return wrapField(<LinkComponent {...createLinkFieldViewModel(field, locale)} />);
    case PropertyPaneFieldType.HorizontalRule:
      return wrapField(<Separator />);
    case PropertyPaneFieldType.Custom:
      return wrapField(
        <CustomFieldComponent
          field={field}
          value={currentValue}
          onPropertyChange={onPropertyChange}
        />
      );
    case PropertyPaneFieldType.DynamicField: {
      const dynamicField = createDynamicFieldViewModel(field, locale);
      return wrapField(
        <DynamicFieldComponent
          currentReference={getDynamicPropertyReference(currentValue)}
          currentValue={getDynamicPropertyValue(currentValue)}
          filters={dynamicField.filters}
          label={dynamicField.label}
          sourceLabel={dynamicField.sourcesLabel}
          sources={getDynamicDataSources(provider)}
          onChange={handleChange}
        />
      );
    }
    case PropertyPaneFieldType.DynamicFieldSet: {
      const dynamicFieldSet = createDynamicFieldSetViewModel(field, locale);
      return wrapField(
        <DynamicFieldSetComponent
          label={dynamicFieldSet.label}
          sharedConfiguration={dynamicFieldSet.sharedConfiguration}
          sources={getDynamicDataSources(provider)}
          entries={dynamicFieldSet.fields.map((dynamicField) => {
            const value = getCurrentValue?.(dynamicField.targetProperty);
            return {
              filters: createDynamicFieldViewModel(dynamicField, locale).filters,
              key: dynamicField.targetProperty,
              label: createDynamicFieldViewModel(dynamicField, locale).label,
              reference: getDynamicPropertyReference(value),
              value: getDynamicPropertyValue(value),
            };
          })}
          onChange={onPropertyChange}
        />
      );
    }
    default:
      return wrapField(
        <Text className={styles.required}>Unsupported field type: {field.type}</Text>
      );
  }
};
