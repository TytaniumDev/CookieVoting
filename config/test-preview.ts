import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';
// import '@/styles/global.css';
// import '@/styles/variables.css';

// Configure environment for Storybook to use Firebase emulators
// Set VITE_USE_EMULATOR=true in your .env file or start emulators before running Storybook
// Note: import.meta.env is read-only in production builds, so we cannot modify it here

const preview: Preview = {
  //👇 Enables auto-generated documentation for all stories
  tags: ['autodocs'],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    docs: {
      toc: true, // Enable table of contents in docs
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
    viewport: {
      options: {
        ...MINIMAL_VIEWPORTS,
      },
    },
  },
  // Global decorators for all stories
  decorators: [
    (Story) => {
      // Wrap stories in a container that matches the app's layout
      return React.createElement(
        'div',
        { style: { padding: '1rem', minHeight: '100vh' } },
        React.createElement(Story),
      );
    },
    // Firebase emulator decorator - only applies when explicitly used in stories
    // Use withFirebaseEmulator decorator in individual stories that need Firebase
  ],
};

export default preview;
