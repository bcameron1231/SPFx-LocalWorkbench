# Storybook Addon for SharePoint Framework

This addon provides SharePoint Framework-specific features for Storybook, including:

- **AMD Module Loading**: Bridges SPFx's AMD module system with Storybook's ES modules
- **Display Mode Control**: Toggle between Edit/Read modes
- **Theme Switching**: Preview components with different SharePoint themes
- **Locale Support**: Test components with different locales
- **Property Pane Panel**: Interactive property pane for web parts
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
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```
