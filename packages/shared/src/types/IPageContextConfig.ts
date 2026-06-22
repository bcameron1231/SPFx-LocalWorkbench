/**
 * Configuration interface for SPFx page context.
 *
 * Used by `buildMockPageContext()` to create the richer runtime shape consumed by
 * the local workbench and Storybook addon.
 */
export interface IPageContextConfig {
  cultureInfo: IPageContextCultureInfoConfig;
  isInitialized?: boolean;
  legacyPageContext?: IPageContextLegacyConfig;
  list?: IPageContextListConfig | null;
  listItem?: IPageContextListItemConfig | null;
  site: IPageContextSiteConfig;
  user: IPageContextUserConfig;
  web: IPageContextWebConfig;
  [key: string]: any;
}

export interface IPageContextPermissionsConfig {
  value?: {
    High?: number;
    Low?: number;
    [key: string]: number | undefined;
  };
  [key: string]: any;
}

export interface IPageContextCultureInfoConfig {
  currentCultureName: string;
  currentUICultureName?: string;
  isRightToLeft?: boolean;
  [key: string]: any;
}

export interface IPageContextLegacyConfig {
  aadTenantId?: string;
  userId?: number;
  isNoScriptEnabled?: boolean;
  isSPO?: boolean;
  [key: string]: any;
}

export interface IPageContextListConfig {
  id?: string;
  permissions?: IPageContextPermissionsConfig;
  serverRelativeUrl?: string;
  title?: string;
  [key: string]: any;
}

export interface IPageContextListItemConfig {
  id?: number;
  [key: string]: any;
}

export interface IPageContextSiteConfig {
  absoluteUrl: string;
  cdnPrefix?: string;
  classification?: string;
  correlationId?: string;
  id?: string;
  isNoScriptEnabled?: boolean;
  recycleBinItemCount?: number;
  serverRelativeUrl?: string;
  serverRequestPath?: string;
  sitePagesEnabled?: boolean;
  [key: string]: any;
}

export interface IPageContextUserConfig {
  displayName: string;
  email: string;
  isAnonymousGuestUser: boolean;
  isExternalGuestUser?: boolean;
  loginName: string;
  preferUserTimeZone?: boolean;
  [key: string]: any;
}

export interface IPageContextWebConfig {
  absoluteUrl: string;
  description: string;
  id?: string;
  isAppWeb?: boolean;
  language?: number;
  languageName?: string;
  logoUrl?: string;
  permissions?: IPageContextPermissionsConfig;
  serverRelativeUrl?: string;
  templateName: string;
  title: string;
  [key: string]: any;
}
