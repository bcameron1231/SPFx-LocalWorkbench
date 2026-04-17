# Changelog

All notable changes to the "SPFx Local Workbench" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
