import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as PropertyPane from '@microsoft/sp-property-pane';
import type { IPropertyPaneCustomFieldProps, IPropertyPaneField } from '@microsoft/sp-property-pane';

import CustomValidationFieldComponent from './components/CustomValidationField';

export interface ICustomValidationFieldContext {
  description: string;
}

export interface ICustomValidationFieldProperties {
  context: ICustomValidationFieldContext;
  fieldKey: string;
  initialValue: string;
  statusTargetProperty: string;
}

const propertyPaneCustomField = (PropertyPane as typeof PropertyPane & {
  PropertyPaneCustomField: (
    properties: IPropertyPaneCustomFieldProps,
  ) => IPropertyPaneField<IPropertyPaneCustomFieldProps>;
}).PropertyPaneCustomField;

export function CustomValidationField(
  targetProperty: string,
  properties: ICustomValidationFieldProperties,
): IPropertyPaneField<IPropertyPaneCustomFieldProps> {
  return propertyPaneCustomField({
    key: properties.fieldKey,
    context: properties.context,
    onDispose: (domElement) => {
      ReactDom.unmountComponentAtNode(domElement);
    },
    onRender: (domElement, context, changeCallback) => {
      const customFieldContext = context as ICustomValidationFieldContext | undefined;

      ReactDom.render(
        React.createElement(CustomValidationFieldComponent, {
          description: customFieldContext?.description ?? '',
          initialValue: properties.initialValue,
          onValueChange: (value: string, isValid: boolean) => {
            changeCallback?.(targetProperty, value, isValid);
            changeCallback?.(
              properties.statusTargetProperty,
              isValid ? 'Valid' : 'Invalid',
              true,
            );
          },
        }),
        domElement,
      );
    },
  });
}
