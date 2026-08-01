# Storybook Addon for SharePoint Framework

This addon provides SharePoint Framework-specific features for Storybook, including:

- **AMD Module Loading**: Bridges SPFx's AMD module system with Storybook's ES modules
- **Display Mode Control**: Toggle between Edit/Read modes
- **Theme Switching**: Preview components with different SharePoint themes
- **Locale Support**: Test components with different locales
- **Live Property Pane**: Use the web part's real property pane inside the Storybook preview
- **Proxy Scenarios**: Switch additive API mock scenarios without leaving Storybook
- **Break Out Panel**: View components in isolation

## Installation

This addon is automatically included when using the SPFx Local Workbench extension.

## Usage

Stories are auto-generated from SPFx manifests, or you can create custom stories:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { withSpfx } from 'storybook-addon-spfx';

const meta: Meta = {
  title: 'WebParts/MyWebPart',
  decorators: [withSpfx],
  parameters: {
    spfx: {
      componentId: 'abc-123-def-456',
      properties: {
        description: 'Hello World'
      },
      showPropertyPane: true,
      proxy: {
        scenario: 'Populated'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

The Edit-properties toolbar button opens the live SPFx property pane in the preview. It is available
in Edit mode and uses the same field rendering, validation, non-reactive Apply behavior, custom
fields, and Dynamic Data provider/source contracts as the Workbench.
`parameters.spfx.showPropertyPane` controls the initial open state whenever a story is loaded; a
toolbar choice only affects the active story.

When the effective mock configuration contains scenarios, Storybook shows a proxy scenario toolbar. `parameters.spfx.proxy.scenario` seeds the selection when a story loads; omitting it seeds **Base rules**. A toolbar choice is temporary and is reset from the next story's parameters on navigation or reload. Unknown scenario names warn and fall back to Base.

The addon remains standalone: it loads proxy metadata from `parameters.spfx.proxy.mockFile`, or `/proxy/api-mocks.json` when no custom path is supplied, and does not use VS Code APIs.
