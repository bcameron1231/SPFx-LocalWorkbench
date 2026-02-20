import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

// Custom Storybook theme with branding
const customTheme = create({
  base: 'light',
  
  // Branding
  brandTitle: 'SPFx Local Workbench Storybook',
  brandUrl: 'https://github.com/bcameron1231/SPFx-LocalWorkbench',
  brandImage: undefined, // Set to a URL or import a logo file here
  brandTarget: '_blank',
  
  // UI Colors (customize as needed)
  // colorPrimary: '#0078d4',
  // colorSecondary: '#106ebe',
  
  // Typography
  // fontBase: '"Segoe UI", "Segoe UI Web", Arial, sans-serif',
  // fontCode: 'Monaco, Consolas, monospace',
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
