import { getLocalizedString } from '@spfx-local-workbench/shared';
import type { IActiveWebPart, ILocalizedString } from '@spfx-local-workbench/shared';

import type {
  IButtonFieldViewModel,
  ICheckboxFieldViewModel,
  IChoiceGroupFieldViewModel,
  IChoiceGroupOptionViewModel,
  IPropertyPaneConditionalGroupModel,
  IDropdownFieldViewModel,
  IDropdownOptionViewModel,
  ILinkFieldViewModel,
  IPropertyPaneGroupModel,
  IPropertyPaneFieldModel,
  ISliderFieldViewModel,
  ITextFieldViewModel,
  ITextOnlyFieldViewModel,
  IToggleFieldViewModel,
  PropertyPanePropertyBag,
  PropertyPaneTextValue,
} from '../types';

function isLocalizedString(value: unknown): value is ILocalizedString {
  return typeof value === 'object' && value !== null && 'default' in value;
}

export function getPropertyValue<T>(
  properties: PropertyPanePropertyBag | undefined,
  ...keys: string[]
): T | undefined {
  if (!properties) {
    return undefined;
  }

  for (const key of keys) {
    if (key in properties) {
      return properties[key] as T;
    }
  }

  return undefined;
}

export function getTextValue(value: PropertyPaneTextValue | unknown, locale?: string): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (isLocalizedString(value)) {
    return getLocalizedString(value, locale);
  }

  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
}

export function getTextProperty(
  properties: PropertyPanePropertyBag | undefined,
  locale: string,
  ...keys: string[]
): string | undefined {
  return getTextValue(getPropertyValue(properties, ...keys), locale);
}

export function getNumericProperty(
  properties: PropertyPanePropertyBag | undefined,
  fallback: number,
  ...keys: string[]
): number {
  const value = getPropertyValue<number>(properties, ...keys);
  return typeof value === 'number' ? value : fallback;
}

export function resolvePropertyPaneLocale(webPart?: IActiveWebPart): string {
  return webPart?.context?.pageContext?.cultureInfo?.currentUICultureName || navigator.language;
}

export function resolvePropertyPaneTitle(webPart?: IActiveWebPart, locale?: string): string {
  const effectiveLocale = locale || resolvePropertyPaneLocale(webPart);
  const preconfiguredEntry =
    webPart?.manifest.preconfiguredEntries?.[webPart.preconfiguredEntryIndex ?? 0] ??
    webPart?.manifest.preconfiguredEntries?.[0];

  return (
    getLocalizedString(preconfiguredEntry?.title, effectiveLocale) ||
    webPart?.manifest.alias ||
    'Properties'
  );
}

export function resolveFieldValue(
  targetProperty: string | undefined,
  properties: Record<string, unknown> | undefined,
  pendingChanges: Record<string, unknown>,
  isNonReactive: boolean,
): unknown {
  if (!targetProperty) {
    return undefined;
  }

  if (isNonReactive && targetProperty in pendingChanges) {
    return pendingChanges[targetProperty];
  }

  return properties?.[targetProperty];
}

export function isConditionalGroup(
  group: IPropertyPaneGroupModel | IPropertyPaneConditionalGroupModel,
): group is IPropertyPaneConditionalGroupModel {
  return 'primaryGroup' in group && 'secondaryGroup' in group;
}

export function resolveGroup(
  group: IPropertyPaneGroupModel | IPropertyPaneConditionalGroupModel,
): IPropertyPaneGroupModel {
  return isConditionalGroup(group)
    ? group.showSecondaryGroup
      ? group.secondaryGroup
      : group.primaryGroup
    : group;
}

export function createTextFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): ITextFieldViewModel {
  const label = getTextProperty(field.properties, locale, 'label', 'Label');
  return {
    label:
      label ||
      (field.targetProperty
        ? field.targetProperty.charAt(0).toUpperCase() + field.targetProperty.slice(1)
        : undefined),
    description: getTextProperty(field.properties, locale, 'description', 'Description'),
    placeholder: getTextProperty(field.properties, locale, 'placeholder', 'Placeholder'),
    multiline: getPropertyValue<boolean>(field.properties, 'multiline', 'Multiline'),
    rows: getNumericProperty(field.properties, 3, 'rows', 'Rows'),
  };
}

export function createCheckboxFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): ICheckboxFieldViewModel {
  return {
    label: getTextProperty(field.properties, locale, 'text', 'Text'),
  };
}

export function createToggleFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): IToggleFieldViewModel {
  return {
    label: getTextProperty(field.properties, locale, 'label', 'Label'),
    onText: getTextProperty(field.properties, locale, 'onText', 'OnText') || 'On',
    offText: getTextProperty(field.properties, locale, 'offText', 'OffText') || 'Off',
  };
}

export function createDropdownFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): IDropdownFieldViewModel {
  const options = (getPropertyValue<Array<{ key: string | number; text: unknown }>>(
    field.properties,
    'options',
    'Options',
  ) || []) as Array<{ key: string | number; text: unknown }>;

  return {
    label: getTextProperty(field.properties, locale, 'label', 'Label'),
    options: options.map(
      (option): IDropdownOptionViewModel => ({
        key: option.key,
        text: getTextValue(option.text, locale) || String(option.key),
      }),
    ),
  };
}

export function createChoiceGroupFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): IChoiceGroupFieldViewModel {
  const options = (getPropertyValue<Array<{ key: string; text: unknown }>>(
    field.properties,
    'options',
    'Options',
  ) || []) as Array<{ key: string; text: unknown }>;

  return {
    label: getTextProperty(field.properties, locale, 'label', 'Label'),
    options: options.map(
      (option): IChoiceGroupOptionViewModel => ({
        key: option.key,
        text: getTextValue(option.text, locale) || option.key,
      }),
    ),
  };
}

export function createSliderFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): ISliderFieldViewModel {
  return {
    label: getTextProperty(field.properties, locale, 'label', 'Label'),
    min: getNumericProperty(field.properties, 0, 'min', 'Min'),
    max: getNumericProperty(field.properties, 100, 'max', 'Max'),
    step: getNumericProperty(field.properties, 1, 'step', 'Step'),
  };
}

export function createButtonFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): IButtonFieldViewModel {
  return {
    text: getTextProperty(field.properties, locale, 'text', 'Text'),
    onClick: getPropertyValue<(value: unknown) => unknown>(field.properties, 'onClick'),
  };
}

export function createTextOnlyFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): ITextOnlyFieldViewModel {
  return {
    text: getTextProperty(field.properties, locale, 'text', 'Text'),
  };
}

export function createLinkFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): ILinkFieldViewModel {
  return {
    text: getTextProperty(field.properties, locale, 'text', 'Text'),
    href: getPropertyValue<string>(field.properties, 'href', 'Href'),
    target: getPropertyValue<string>(field.properties, 'target', 'Target') || '_blank',
  };
}
