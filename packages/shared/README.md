# @spfx-local-workbench/shared

Shared code for SPFx Local Workbench extension and Storybook addon.

## Overview

This package provides shared utilities, components, and mocks used by both the VS Code extension and Storybook addon. It ensures consistent behavior and reduces code duplication.

## Structure

- **`mocks/`** - SPFx mocking utilities
- **`components/`** - Shared React components  
- **`constants/`** - Default configuration values
- **`types/`** - TypeScript type definitions

## Features

### Constants

- **DEFAULT_PAGE_CONTEXT**: Default pageContext configuration
  - Single source of truth for mock pageContext values
  - Used by extension, webview, and Storybook addon
  - Includes site, web, user, and culture info defaults

- **MICROSOFT_THEMES**: Microsoft 365 theme collection
  - 10 official Microsoft themes (Teal, Blue, Orange, Red, Purple, Green, Periwinkle, Cobalt, Dark Teal, Dark Blue)
  - Complete Fluent UI color palettes
  - Used for theme selection in both extension and Storybook

### Mocks

- **MockGuid**: Full implementation of SPFx `sp-core-library` Guid interface
  - Supports all SPFx GUID formats (standard, wrapped, SharePoint-specific)
  - Methods: `parse()`, `tryParse()`, `isValid()`, `equals()`, `toString()`, `newGuid()`, `empty`

- **buildMockPageContext()**: Unified pageContext builder
  - Computes `serverRelativeUrl` from `absoluteUrl`
  - Converts GUID strings to MockGuid instances
  - Calculates `language` LCID from culture name
  - Sets `isRightToLeft` based on culture  
  - Adds `permissions`, `legacyPageContext`, etc.

- **PropertyPaneMocks**: Mock implementations of SPFx property pane controls
  - PropertyPaneTextField, PropertyPaneCheckbox, PropertyPaneDropdown, etc.
  - Used to register AMD modules for SPFx components

- **Utility Functions**:
  - `isRtlCulture(culture: string): boolean`
  - `getLanguageCodeFromCulture(culture: string): number`

### Components

- **ThemePreview**: Visual preview of Fluent UI themes
  - Displays color swatches and text preview
  - Used in theme pickers across extension and Storybook

### Types

Each type is in its own file for better organization:
- **`ITheme`**: SharePoint theme definition
- **`IThemePalette`**: Fluent UI theme color tokens
- **`IPageContextConfig`**: Configuration for mock page context
- **`IThemePreviewProps`**: Props for ThemePreview component

## Usage

```typescript
import { MockGuid, buildMockPageContext, type IPageContextConfig } from '@spfx-local-workbench/mocks';

// Create a mock pageContext
const config: IPageContextConfig = {
  site: {
    absoluteUrl: 'https://contoso.sharepoint.com/sites/dev',
    id: '00000000-0000-4000-b000-666666666666'
  },
  web: {
    absoluteUrl: 'https://contoso.sharepoint.com/sites/dev',
    title: 'Development',
    description: 'Dev site',
    templateName: 'STS#3',
    id: '00000000-0000-4000-b000-777777777777'
  },
  user: {
    displayName: 'Dev User',
    email: 'dev@contoso.com',
    loginName: 'i:0#.f|membership|dev@contoso.com',
    isAnonymousGuestUser: false
  },
  cultureInfo: {
    currentCultureName: 'en-US'
  }
};

const mockPageContext = buildMockPageContext(config);

// mockPageContext now includes:
// - web.id and site.id as MockGuid instances  
// - web.serverRelativeUrl and site.serverRelativeUrl computed from URLs
// - web.language (1033) computed from cultureInfo
// - cultureInfo.isRightToLeft (false) computed from culture
// - permissions.hasPermission() method
// - legacyPageContext with all legacy properties
```

## Consumers

- **webview/src/mocks/SpfxContext.ts** - VS Code workbench webview
- **packages/storybook-addon-spfx** - Storybook addon decorator

Both consumers get identical pageContext structure, ensuring consistent SPFx component behavior.
