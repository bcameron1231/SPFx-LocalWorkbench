import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

// theme.json is written by the extension with VS Code colors before Storybook starts.
// At compile time the file is an empty stub, so we cast to suppress type errors.
import themeJson from './theme.json';

const vsCodeTheme = themeJson as any;

// Build the Storybook theme. vsCodeTheme provides color/base values derived from
// the active VS Code theme. Values defined below always win (spread last).
// When theme.json is empty (colors unavailable), Storybook uses its own defaults.
const customTheme = create({
  ...vsCodeTheme,

  // Typography — always Segoe UI to match SPFx, regardless of VS Code theme.
  fontBase: '"Segoe UI", "Segoe UI Web", Arial, sans-serif',
  // Code font comes from theme.json (user's VS Code editor font). Falls back to
  // Storybook's default when not present.
  ...(vsCodeTheme.fontCode ? { fontCode: vsCodeTheme.fontCode } : {}),

  // Branding — always fixed.
  brandTitle: 'SPFx Local Workbench Storybook',
  brandUrl: 'https://github.com/bcameron1231/SPFx-LocalWorkbench',
  brandImage: undefined,
  brandTarget: '_blank',
});

addons.setConfig({
  theme: customTheme,
  sidebar: {
    collapsedRoots: [],
  },
  enableShortcuts: true,
});

// Reduce tooltip delay via CSS custom property
// Storybook uses CSS transitions for tooltips with a default delay
const style = document.createElement('style');
style.innerHTML = `
  /* Reduce Storybook tooltip delay from 1000ms to 200ms */
  :root {
    --sb-tooltip-delay: 200ms !important;
  }
  
  /* Target tooltip elements directly if custom property doesn't work */
  [role="tooltip"],
  [data-radix-popper-content-wrapper],
  .os-tooltip {
    transition-delay: 200ms !important;
  }
`;
document.head.appendChild(style);
