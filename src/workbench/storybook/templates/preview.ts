import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: {
      disable: true
    },
    toolbar: {
      copy: { hidden: true },
      eject: { hidden: true }
    }
  }
};

export default preview;
