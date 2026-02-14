import { IPageContextConfig } from "../types";

/**
 * Default pageContext configuration
 * This is the single source of truth for default values.
 * 
 * NOTE: These values are duplicated in /package.json (spfxLocalWorkbench.context.pageContext)
 * for VS Code configuration schema. Keep them synchronized manually.
 */
export const DEFAULT_PAGE_CONTEXT: IPageContextConfig = {
    site: {
        absoluteUrl: 'https://contoso.sharepoint.com/sites/devsite',
        id: '00000000-0000-4000-b000-666666666666'
    },
    web: {
        absoluteUrl: 'https://contoso.sharepoint.com/sites/devsite',
        title: 'Local Workbench',
        description: 'Local development workbench for SPFx',
        templateName: 'STS#3',
        id: '00000000-0000-4000-b000-777777777777'
    },
    user: {
        displayName: 'Local Workbench User',
        email: 'user@contoso.onmicrosoft.com',
        loginName: 'i:0#.f|membership|user@contoso.onmicrosoft.com',
        isAnonymousGuestUser: false
    },
    cultureInfo: {
        currentCultureName: 'en-US'
    },
    isNoScriptEnabled: false,
    isSPO: true
};