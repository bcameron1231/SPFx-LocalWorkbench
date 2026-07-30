# Changelog

All notable changes to the "SPFx Local Workbench" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## Added

- Workbench theme picker accessibility improvements including keyboard controls
- Extended manifest context to provide the full manifest
- Property Pane simulates the always present Visibility group
- Dynamic Data is now supported including the standard Page enivonment source populated using page context configuration
- Pseudo-locale generation for any SPFx component from `loc` folders or locale files while preserving formatting and placeholders using configurable SPFx-style length expansion

## Changed

- Workbench status bar now uses VS Code styles to match user theming while preserving M365 theming for main canvas
- Workbench theme picker shows a tiny palette swatch for extra prettiness
- Property Pane now supports page navigation, accordion group interaction, richer built-in control props, button bound-value updates, and initial field focus behavior
- Page Context defaults now provide the full set of properties and legacyPageContext is auto built from them while remaining overridable
- The workbench component picker now auto-focuses on the searchbox

## Fixed

- Serve not running message wasn't readable in dark themes, now it is
- Property Pane no longer overlaps the status bar and theme picker
- Property Pane closes when associated web part is removed
- SPFx serve and open command cancellation/timeout no longer prompts to open workbench if it's already open
- Property Pane custom fields can now update bound properties beyond their default target
- Property Pane dynamic field surfaces no longer fall back to placeholders
- Property Pane control styles now match M365 property pane controls

## [0.1.3] - 2026-06-04

## Added

- HTML Field Security Settings
  - policy (none, allowAll, allowList), default: allowList
  - allowedDomains, default: matches SharePoint Online

### Changed

- Change VS Code Marketplace publisher to [M365pnp](https://marketplace.visualstudio.com/publishers/m365pnp)

## [0.0.1] - 2026-04-17

### Added

#### Web Parts

- Automatic SPFx project detection in workspace
- Web part discovery and manifest parsing
- Custom-built SPFx runtime environment with AMD module loading
- Full property pane support for web part configuration
- Live reload support with `heft start`
- Multiple web parts support on canvas
- Theme support with standard SharePoint themes and custom themes

#### Application Customizers

- Application Customizer manifest detection
- Header and footer placeholder zones (Top and Bottom)
- Interactive extension add/remove functionality
- Property editing for ClientSideComponentProperties
- Full PlaceholderProvider mock implementation with `tryCreateContent()` and `changedEvent`

#### Storybook Integration (Beta)

- Auto-generated Storybook stories from SPFx component manifests
- Story variants for each locale defined in components
- Story variants for preconfigured web part entries
- Custom Storybook addon with full SPFx context
- Theme switching in Storybook
- Visual testing and component isolation
- Live development alongside SPFx projects

#### API Proxy & Mock System

- Drop-in HTTP client replacements (SPHttpClient, HttpClient, AadHttpClient)
- Configurable mock rules with URL matching
- Glob pattern matching for URL patterns
- Client type filtering (spHttp, http, aadHttp)
- Hot reload for mock configuration changes
- Request logging to "SPFx API Proxy" output channel
- Optional proxy mode for use with external tools like Dev Proxy
- JSON and file-based response support

### Documentation

- Comprehensive README with feature overview
- Proxy architecture and setup guide (PROXY.md)
- Mock data generation guide (MOCK-DATA.md)
- Contributing guidelines (CONTRIBUTING.md)
- Troubleshooting guide (TROUBLESHOOTING.md)
