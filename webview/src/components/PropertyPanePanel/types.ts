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
  label?: string;
  description?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

export interface ICheckboxFieldViewModel {
  label?: string;
}

export interface IToggleFieldViewModel {
  label?: string;
  onText: string;
  offText: string;
}

export interface IDropdownOptionViewModel {
  key: string | number;
  text: string;
}

export interface IDropdownFieldViewModel {
  label?: string;
  options: IDropdownOptionViewModel[];
}

export interface IChoiceGroupOptionViewModel {
  key: string;
  text: string;
}

export interface IChoiceGroupFieldViewModel {
  label?: string;
  options: IChoiceGroupOptionViewModel[];
}

export interface ISliderFieldViewModel {
  label?: string;
  min: number;
  max: number;
  step: number;
}

export interface IButtonFieldViewModel {
  text?: string;
  onClick?: (value: unknown) => unknown;
}

export interface ITextOnlyFieldViewModel {
  text?: string;
}

export interface ILinkFieldViewModel {
  text?: string;
  href?: string;
  target?: string;
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
