import { getLocalizedString } from '@spfx-local-workbench/shared';
import type { IActiveWebPart, ILocalizedString } from '@spfx-local-workbench/shared';

import type {
  IButtonFieldViewModel,
  ICheckboxFieldViewModel,
  IChoiceGroupFieldViewModel,
  IChoiceGroupOptionViewModel,
  IDropdownFieldViewModel,
  IDropdownOptionViewModel,
  IDynamicDataSourceViewModel,
  IDynamicFieldFiltersViewModel,
  IDynamicFieldSetViewModel,
  IDynamicFieldViewModel,
  ILinkFieldViewModel,
  IPropertyPaneConditionalGroupModel,
  IPropertyPaneFieldModel,
  IPropertyPaneGroupModel,
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

export function getTextValue(
  value: PropertyPaneTextValue | unknown,
  locale?: string,
): string | undefined {
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

export function getBooleanProperty(
  properties: PropertyPanePropertyBag | undefined,
  fallback: boolean,
  ...keys: string[]
): boolean {
  const value = getPropertyValue<boolean>(properties, ...keys);
  return typeof value === 'boolean' ? value : fallback;
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
    ariaLabel: getTextProperty(field.properties, locale, 'ariaLabel', 'AriaLabel'),
    disabled: getBooleanProperty(field.properties, false, 'disabled', 'Disabled'),
    errorMessage: getTextProperty(field.properties, locale, 'errorMessage', 'ErrorMessage'),
    maxLength: getPropertyValue<number>(field.properties, 'maxLength', 'MaxLength'),
    placeholder: getTextProperty(field.properties, locale, 'placeholder', 'Placeholder'),
    multiline: getPropertyValue<boolean>(field.properties, 'multiline', 'Multiline'),
    readOnly: getBooleanProperty(field.properties, false, 'readOnly', 'ReadOnly'),
    resizable: getBooleanProperty(field.properties, true, 'resizable', 'Resizable'),
    rows: getNumericProperty(field.properties, 3, 'rows', 'Rows'),
    underlined: getBooleanProperty(field.properties, false, 'underlined', 'Underlined'),
    validateOnFocusIn: getBooleanProperty(
      field.properties,
      false,
      'validateOnFocusIn',
      'ValidateOnFocusIn',
    ),
    validateOnFocusOut: getBooleanProperty(
      field.properties,
      false,
      'validateOnFocusOut',
      'ValidateOnFocusOut',
    ),
    deferredValidationTime: getPropertyValue<number>(
      field.properties,
      'deferredValidationTime',
      'DeferredValidationTime',
    ),
    onGetErrorMessage: getPropertyValue<(value: string) => string | Promise<string>>(
      field.properties,
      'onGetErrorMessage',
    ),
  };
}

export function createCheckboxFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): ICheckboxFieldViewModel {
  return {
    ariaLabel: getTextProperty(field.properties, locale, 'ariaLabel', 'AriaLabel'),
    disabled: getBooleanProperty(field.properties, false, 'disabled', 'Disabled'),
    label: getTextProperty(field.properties, locale, 'text', 'Text'),
  };
}

export function createToggleFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): IToggleFieldViewModel {
  return {
    ariaLabel: getTextProperty(field.properties, locale, 'ariaLabel', 'AriaLabel'),
    disabled: getBooleanProperty(field.properties, false, 'disabled', 'Disabled'),
    inlineLabel: getBooleanProperty(field.properties, false, 'inlineLabel', 'InlineLabel'),
    label: getTextProperty(field.properties, locale, 'label', 'Label'),
    onText: getTextProperty(field.properties, locale, 'onText', 'OnText') || 'On',
    offAriaLabel: getTextProperty(field.properties, locale, 'offAriaLabel', 'OffAriaLabel'),
    offText: getTextProperty(field.properties, locale, 'offText', 'OffText') || 'Off',
    onAriaLabel: getTextProperty(field.properties, locale, 'onAriaLabel', 'OnAriaLabel'),
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
        disabled: !!option.disabled,
        index: getPropertyValue<number>(option as PropertyPanePropertyBag, 'index', 'Index'),
        itemType: getPropertyValue<number>(option as PropertyPanePropertyBag, 'type', 'Type'),
        key: option.key,
        text: getTextValue(option.text, locale) || String(option.key),
      }),
    ),
    ariaLabel: getTextProperty(field.properties, locale, 'ariaLabel', 'AriaLabel'),
    calloutMaxHeight: getPropertyValue<number>(
      getPropertyValue<PropertyPanePropertyBag>(field.properties, 'calloutProps', 'CalloutProps'),
      'calloutMaxHeight',
      'CalloutMaxHeight',
    ),
    disabled: getBooleanProperty(field.properties, false, 'disabled', 'Disabled'),
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
        ariaLabel: getTextValue(
          getPropertyValue(option as PropertyPanePropertyBag, 'ariaLabel', 'AriaLabel'),
          locale,
        ),
        checked: !!getPropertyValue<boolean>(
          option as PropertyPanePropertyBag,
          'checked',
          'Checked',
        ),
        disabled: !!getPropertyValue<boolean>(
          option as PropertyPanePropertyBag,
          'disabled',
          'Disabled',
        ),
        iconProps: normalizeChoiceGroupIconProps(
          getPropertyValue<{ iconName?: string; officeFabricIconFontName?: string } | undefined>(
            option as PropertyPanePropertyBag,
            'iconProps',
            'IconProps',
          ),
        ),
        imageAlt: getTextValue(
          getPropertyValue(option as PropertyPanePropertyBag, 'imageAlt', 'ImageAlt'),
          locale,
        ),
        imageSize: getPropertyValue<{ height: number; width: number }>(
          option as PropertyPanePropertyBag,
          'imageSize',
          'ImageSize',
        ),
        imageSrc: getPropertyValue<string>(
          option as PropertyPanePropertyBag,
          'imageSrc',
          'ImageSrc',
        ),
        // selectedImageSrc: getPropertyValue<string>(
        //   option as PropertyPanePropertyBag,
        //   'selectedImageSrc',
        //   'SelectedImageSrc',
        // ),
        selectedImageSrc: getPropertyValue<string>(
          option as PropertyPanePropertyBag,
          'imageSrc', // Align with online bug where selected src is ignored
          'ImageSrc',
        ),
        key: option.key,
        text: getTextValue(option.text, locale) || option.key,
      }),
    ),
    disabled: getBooleanProperty(field.properties, false, 'disabled', 'Disabled'),
  };
}

function normalizeChoiceGroupIconProps(iconProps?: {
  iconName?: string;
  officeFabricIconFontName?: string;
}): { iconName?: string } | undefined {
  if (!iconProps) {
    return undefined;
  }

  return {
    iconName: iconProps.iconName || iconProps.officeFabricIconFontName,
  };
}

export function createSliderFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): ISliderFieldViewModel {
  return {
    ariaLabel: getTextProperty(field.properties, locale, 'ariaLabel', 'AriaLabel'),
    disabled: getBooleanProperty(field.properties, false, 'disabled', 'Disabled'),
    label: getTextProperty(field.properties, locale, 'label', 'Label'),
    min: getNumericProperty(field.properties, 0, 'min', 'Min'),
    max: getNumericProperty(field.properties, 100, 'max', 'Max'),
    showValue: getBooleanProperty(field.properties, true, 'showValue', 'ShowValue'),
    step: getNumericProperty(field.properties, 1, 'step', 'Step'),
  };
}

export function createButtonFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): IButtonFieldViewModel {
  return {
    ariaDescription: getTextProperty(
      field.properties,
      locale,
      'ariaDescription',
      'AriaDescription',
    ),
    ariaLabel: getTextProperty(field.properties, locale, 'ariaLabel', 'AriaLabel'),
    buttonType: getPropertyValue<number>(field.properties, 'buttonType', 'ButtonType'),
    description: getTextProperty(field.properties, locale, 'description', 'Description'),
    disabled: getBooleanProperty(field.properties, false, 'disabled', 'Disabled'),
    iconProps: normalizeButtonIconProps(
      getPropertyValue<{ iconName?: string; officeFabricIconFontName?: string } | string | undefined>(
        field.properties,
        'icon',
        'Icon',
      ),
    ),
    text: getTextProperty(field.properties, locale, 'text', 'Text'),
    onClick: getPropertyValue<(value: unknown) => unknown>(field.properties, 'onClick'),
  };
}

function normalizeButtonIconProps(
  icon:
    | {
        iconName?: string;
        officeFabricIconFontName?: string;
      }
    | string
    | undefined,
): { iconName?: string } | undefined {
  if (!icon) {
    return undefined;
  }

  if (typeof icon === 'string') {
    return { iconName: icon };
  }

  return {
    iconName: icon.iconName || icon.officeFabricIconFontName,
  };
}

export function createTextOnlyFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): ITextOnlyFieldViewModel {
  return {
    required: getBooleanProperty(field.properties, false, 'required', 'Required'),
    text: getTextProperty(field.properties, locale, 'text', 'Text'),
  };
}

export function createLinkFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): ILinkFieldViewModel {
  return {
    ariaLabel: getTextProperty(field.properties, locale, 'ariaLabel', 'AriaLabel'),
    disabled: getBooleanProperty(field.properties, false, 'disabled', 'Disabled'),
    text: getTextProperty(field.properties, locale, 'text', 'Text'),
    href: getPropertyValue<string>(field.properties, 'href', 'Href'),
    target: getPropertyValue<string>(field.properties, 'target', 'Target') || '_blank',
  };
}

export function createDynamicFieldViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): IDynamicFieldViewModel {
  return {
    filters: getPropertyValue<IDynamicFieldFiltersViewModel>(
      field.properties,
      'filters',
      'Filters',
    ),
    label: getTextProperty(field.properties, locale, 'label', 'Label'),
    propertyValueDepth: getPropertyValue<number>(
      field.properties,
      'propertyValueDepth',
      'PropertyValueDepth',
    ),
    sourcesLabel: getTextProperty(field.properties, locale, 'sourcesLabel', 'SourcesLabel'),
  };
}

export function createDynamicFieldSetViewModel(
  field: IPropertyPaneFieldModel,
  locale: string,
): IDynamicFieldSetViewModel {
  const properties = field.properties as PropertyPanePropertyBag;
  const sharedConfiguration = getPropertyValue<PropertyPanePropertyBag>(
    properties,
    'sharedConfiguration',
    'SharedConfiguration',
  );
  return {
    fields: getPropertyValue<IPropertyPaneFieldModel[]>(properties, 'fields', 'Fields') || [],
    label: getTextProperty(properties, locale, 'label', 'Label'),
    sharedConfiguration: sharedConfiguration
      ? {
          depth: getPropertyValue<number>(sharedConfiguration, 'depth', 'Depth'),
          property: getPropertyValue<PropertyPanePropertyBag>(
            sharedConfiguration,
            'property',
            'Property',
          )
            ? {
                filters: getPropertyValue<IDynamicFieldFiltersViewModel>(
                  getPropertyValue<PropertyPanePropertyBag>(
                    sharedConfiguration,
                    'property',
                    'Property',
                  ),
                  'filters',
                  'Filters',
                ),
              }
            : undefined,
          source: getPropertyValue<PropertyPanePropertyBag>(sharedConfiguration, 'source', 'Source')
            ? {
                filters: getPropertyValue<IDynamicFieldFiltersViewModel>(
                  getPropertyValue<PropertyPanePropertyBag>(
                    sharedConfiguration,
                    'source',
                    'Source',
                  ),
                  'filters',
                  'Filters',
                ),
                sourcesLabel: getTextProperty(
                  getPropertyValue<PropertyPanePropertyBag>(
                    sharedConfiguration,
                    'source',
                    'Source',
                  ),
                  locale,
                  'sourcesLabel',
                  'SourcesLabel',
                ),
              }
            : undefined,
        }
      : undefined,
  };
}

export function getDynamicDataSources(provider: unknown): IDynamicDataSourceViewModel[] {
  if (!provider || typeof provider !== 'object') {
    return [];
  }

  const getAvailableSources = (
    provider as {
      getAvailableSources?: () => Array<{
        id: string;
        metadata?: {
          alias?: string;
          componentId?: string;
          description?: string;
          instanceId?: string;
          title?: string;
        };
        getPropertyDefinitions?: () => Array<{ id: string; title: string }>;
      }>;
    }
  ).getAvailableSources;

  if (typeof getAvailableSources !== 'function') {
    return [];
  }

  return (getAvailableSources() || []).map((source) => ({
    id: source.id,
    metadata: source.metadata,
    properties:
      source.getPropertyDefinitions?.().map((property) => ({
        id: property.id,
        title: property.title,
      })) || [],
  }));
}

export function getDynamicPropertyReference(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'reference' in value) {
    const reference = (value as { reference?: unknown }).reference;
    return typeof reference === 'string' ? reference : undefined;
  }

  return undefined;
}

export function getDynamicPropertyValue(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'tryGetValue' in value) {
    const tryGetValue = (value as { tryGetValue?: () => unknown }).tryGetValue;
    if (typeof tryGetValue === 'function') {
      const resolvedValue = tryGetValue();
      return formatDynamicValue(resolvedValue);
    }
  }

  return formatDynamicValue(value);
}

function formatDynamicValue(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
