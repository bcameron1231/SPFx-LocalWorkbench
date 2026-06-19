import type { ILocalizedString } from '@spfx-local-workbench/shared';

export type PropertyPanePropertyBag = Record<string, unknown>;
export type PropertyPaneTextValue = string | ILocalizedString | undefined;
export type PropertyPaneFieldChangeCallback = (
  targetProperty?: string,
  newValue?: unknown,
  isValidEntry?: boolean,
) => void;

export interface IPropertyPaneConfigurationModel {
  currentPage?: number;
  showLoadingIndicator?: boolean;
  loadingIndicatorDelayTime?: number;
  pages: IPropertyPanePageModel[];
}

export interface IPropertyPanePageModel {
  displayGroupsAsAccordion?: boolean;
  header?: {
    description: string;
  };
  groups: Array<IPropertyPaneGroupModel | IPropertyPaneConditionalGroupModel>;
}

export interface IPropertyPaneGroupModel {
  groupName?: string;
  isGroupNameHidden?: boolean;
  isCollapsed?: boolean;
  groupFields: IPropertyPaneFieldModel[];
}

export interface IPropertyPaneConditionalGroupModel {
  onShowPrimaryGroup?: () => void;
  onShowSecondaryGroup?: () => void;
  primaryGroup: IPropertyPaneGroupModel;
  secondaryGroup: IPropertyPaneGroupModel;
  showSecondaryGroup: boolean;
}

export interface IPropertyPaneFieldModel<TProps extends PropertyPanePropertyBag = PropertyPanePropertyBag> {
  type: number;
  targetProperty: string;
  shouldFocus?: boolean;
  properties: TProps;
}

export interface ITextFieldViewModel {
  ariaLabel?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  errorMessage?: string;
  maxLength?: number;
  placeholder?: string;
  multiline?: boolean;
  readOnly?: boolean;
  resizable?: boolean;
  rows?: number;
  underlined?: boolean;
  validateOnFocusIn?: boolean;
  validateOnFocusOut?: boolean;
  deferredValidationTime?: number;
  onGetErrorMessage?: (value: string) => string | Promise<string>;
}

export interface ICheckboxFieldViewModel {
  ariaLabel?: string;
  disabled?: boolean;
  label?: string;
}

export interface IToggleFieldViewModel {
  ariaLabel?: string;
  disabled?: boolean;
  inlineLabel?: boolean;
  label?: string;
  onText: string;
  offAriaLabel?: string;
  offText: string;
  onAriaLabel?: string;
}

export interface IDropdownOptionViewModel {
  disabled?: boolean;
  index?: number;
  key: string | number;
  text: string;
  type?: number;
}

export interface IDropdownFieldViewModel {
  ariaLabel?: string;
  calloutMaxHeight?: number;
  disabled?: boolean;
  label?: string;
  options: IDropdownOptionViewModel[];
}

export interface IChoiceGroupOptionViewModel {
  checked?: boolean;
  disabled?: boolean;
  iconProps?: { iconName?: string };
  imageAlt?: string;
  imageSize?: { height: number; width: number };
  imageSrc?: string;
  key: string;
  text: string;
}

export interface IChoiceGroupFieldViewModel {
  ariaLabel?: string;
  disabled?: boolean;
  label?: string;
  options: IChoiceGroupOptionViewModel[];
}

export interface ISliderFieldViewModel {
  ariaLabel?: string;
  disabled?: boolean;
  label?: string;
  min: number;
  max: number;
  showValue?: boolean;
  step: number;
}

export interface IButtonFieldViewModel {
  ariaDescription?: string;
  ariaLabel?: string;
  buttonType?: number;
  disabled?: boolean;
  text?: string;
  onClick?: (value: unknown) => unknown;
}

export interface ITextOnlyFieldViewModel {
  text?: string;
}

export interface ILinkFieldViewModel {
  ariaLabel?: string;
  disabled?: boolean;
  text?: string;
  href?: string;
  target?: string;
}

export interface IDynamicDataPropertyDefinitionViewModel {
  id: string;
  title: string;
}

export interface IDynamicDataSourceViewModel {
  id: string;
  metadata?: {
    alias?: string;
    componentId?: string;
    description?: string;
    instanceId?: string;
    title?: string;
  };
  properties: IDynamicDataPropertyDefinitionViewModel[];
}

export interface IDynamicFieldFiltersViewModel {
  componentId?: string;
  propertyId?: string;
  sourceId?: string;
}

export interface IDynamicFieldViewModel {
  filters?: IDynamicFieldFiltersViewModel;
  label?: string;
  propertyValueDepth?: number;
  sourcesLabel?: string;
}

export interface IDynamicFieldSetViewModel {
  fields: IPropertyPaneFieldModel[];
  label?: string;
  sharedConfiguration?: {
    depth?: number;
    property?: {
      filters?: IDynamicFieldFiltersViewModel;
    };
    source?: {
      filters?: IDynamicFieldFiltersViewModel;
      sourcesLabel?: string;
    };
  };
}

export interface IPropertyPaneCustomFieldPropsModel extends PropertyPanePropertyBag {
  context?: unknown;
  key: string;
  onDispose?: (domElement: HTMLElement, context?: unknown) => void;
  onRender: (
    domElement: HTMLElement,
    context?: unknown,
    changeCallback?: PropertyPaneFieldChangeCallback,
  ) => void;
}
