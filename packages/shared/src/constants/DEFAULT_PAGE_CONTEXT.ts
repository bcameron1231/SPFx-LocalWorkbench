import { IPageContextConfig } from '../types';

/**
 * Default pageContext configuration
 * This is the single source of truth for default values.
 *
 * NOTE: These values are duplicated in /package.json (spfxLocalWorkbench.context.pageContext)
 * for VS Code configuration schema. Keep them synchronized manually.
 */
export const DEFAULT_PAGE_CONTEXT: IPageContextConfig = {
  cultureInfo: {
    currentCultureName: 'en-US',
    currentUICultureName: 'en-US',
    isRightToLeft: false,
  },
  isInitialized: true,
  legacyPageContext: {
    isNoScriptEnabled: false,
    isSPO: true,
  },
  list: {
    id: '00000000-0000-4000-b000-555555555555',
    permissions: {
      value: {
        High: 2147483647,
        Low: 4294705151,
      },
    },
    serverRelativeUrl: '/sites/devsite/SitePages',
    title: 'Site Pages',
  },
  listItem: {
    id: 1,
  },
  site: {
    absoluteUrl: 'https://contoso.sharepoint.com/sites/devsite',
    cdnPrefix: 'res-1.public.onecdn.static.microsoft/bld',
    classification: '',
    correlationId: '00000000-0000-4000-b000-888888888888',
    id: '00000000-0000-4000-b000-666666666666',
    isNoScriptEnabled: false,
    recycleBinItemCount: -1,
    serverRelativeUrl: '/sites/devsite',
    serverRequestPath: '/sites/devsite/SitePages/Home.aspx',
    sitePagesEnabled: true,
  },
  web: {
    absoluteUrl: 'https://contoso.sharepoint.com/sites/devsite',
    title: 'SPFx Local Workbench',
    description: 'Local development workbench for SPFx',
    id: '00000000-0000-4000-b000-777777777777',
    isAppWeb: false,
    language: 1033,
    languageName: 'en-US',
    logoUrl: '_layouts/15/images/siteicon.png',
    permissions: {
      value: {
        High: 2147483647,
        Low: 4294705151,
      },
    },
    serverRelativeUrl: '/sites/devsite',
    templateName: '68',
  },
  user: {
    displayName: 'Local Workbench User',
    email: 'user@contoso.onmicrosoft.com',
    isAnonymousGuestUser: false,
    isExternalGuestUser: false,
    loginName: 'user@contoso.onmicrosoft.com',
    preferUserTimeZone: false,
  },
};
