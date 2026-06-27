export interface IPropertyPaneStrings {
  applyButtonText: string;
  backButtonText: string;
  collapseGroupAriaLabel: string;
  connectToSourceText: string;
  conditionalConnectToSourceText: string;
  conditionalMenuAriaLabel: string;
  conditionalRemoveConnectionText: string;
  defaultHeaderText: string;
  expandGroupAriaLabel: string;
  nextButtonText: string;
  pageCountText: string;
  unsupportedFieldTypeText: string;
  visibilityGroupName: string;
  visibilityToggleLabel: string;
  visibilityToggleOnText: string;
  visibilityToggleOffText: string;
}

export interface IDynamicDataStrings {
  currentUserInformationTitle: string;
  fragmentLabel: string;
  itemIdLabel: string;
  listUrlLabel: string;
  pageEnvironmentDescription: string;
  pageEnvironmentSourceAlias: string;
  pageEnvironmentSourceTitle: string;
  propertiesLabelFormat: string;
  queryParametersLabel: string;
  queryStringTitle: string;
  searchTitle: string;
  siteClassificationLabel: string;
  siteCollectionUrlLabel: string;
  siteDescriptionLabel: string;
  siteLogoUrlLabel: string;
  sitePropertiesTitle: string;
  siteTitleLabel: string;
  siteUrlLabel: string;
  userEmailLabel: string;
  userLoginLabel: string;
  userNameLabel: string;
}

export const DEFAULT_PROPERTY_PANE_STRINGS: IPropertyPaneStrings = {
  applyButtonText: 'Apply',
  backButtonText: 'Back',
  collapseGroupAriaLabel: 'Collapse group',
  connectToSourceText: 'Connect to source',
  conditionalConnectToSourceText: 'Connect to source',
  conditionalMenuAriaLabel: 'Conditional group actions',
  conditionalRemoveConnectionText: 'Remove connection',
  defaultHeaderText: 'Properties',
  expandGroupAriaLabel: 'Expand group',
  nextButtonText: 'Next',
  pageCountText: '{0} of {1}',
  unsupportedFieldTypeText: 'Unsupported field type: {0}',
  visibilityGroupName: 'Visibility',
  visibilityToggleLabel: 'Show in mobile and email view',
  visibilityToggleOnText: 'On',
  visibilityToggleOffText: 'Off',
};

export const DEFAULT_DYNAMIC_DATA_STRINGS: IDynamicDataStrings = {
  currentUserInformationTitle: 'Current user information',
  fragmentLabel: 'URL fragment',
  itemIdLabel: 'Item id',
  listUrlLabel: 'List link',
  pageEnvironmentDescription:
    'Built-in mock page environment values mapped from the configured SPFx page context.',
  pageEnvironmentSourceAlias: 'Page environment',
  pageEnvironmentSourceTitle: 'Page environment',
  propertiesLabelFormat: "{0}'s properties",
  queryParametersLabel: 'Query parameters',
  queryStringTitle: 'Query string',
  searchTitle: 'Search',
  siteClassificationLabel: 'Site classification',
  siteCollectionUrlLabel: 'Site collection link',
  siteDescriptionLabel: 'Site description',
  siteLogoUrlLabel: 'Site logo',
  sitePropertiesTitle: 'Site properties',
  siteTitleLabel: 'Site title',
  siteUrlLabel: 'Site link',
  userEmailLabel: 'User email',
  userLoginLabel: 'Login name',
  userNameLabel: 'User name',
};

interface IWorkbenchConfigLike {
  dynamicDataStrings?: Partial<IDynamicDataStrings>;
  propertyPaneStrings?: Partial<IPropertyPaneStrings>;
}

function getWorkbenchConfig(): IWorkbenchConfigLike | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return (window as Window & { __workbenchConfig?: IWorkbenchConfigLike }).__workbenchConfig;
}

export function getPropertyPaneStrings(): IPropertyPaneStrings {
  return {
    ...DEFAULT_PROPERTY_PANE_STRINGS,
    ...getWorkbenchConfig()?.propertyPaneStrings,
  };
}

export function getDynamicDataStrings(): IDynamicDataStrings {
  return {
    ...DEFAULT_DYNAMIC_DATA_STRINGS,
    ...getWorkbenchConfig()?.dynamicDataStrings,
  };
}
