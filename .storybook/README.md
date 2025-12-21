# Storybook Configuration

This directory contains the Storybook configuration for the Cookie Voting application.

## Overview

Storybook is set up to help document and test UI components in isolation. Components are organized using Atomic Design principles:

- **Atoms**: Basic building blocks (buttons, inputs, etc.)
- **Molecules**: Simple combinations (AlertModal, AuthButton)
- **Organisms**: Complex components (ImageWithDetections, ImageTagger, CookieViewer)
- **Templates**: Page-level layouts (Layout)

## Firebase Emulator Integration

Many components integrate with Firebase services. To test these components in Storybook with the Firebase emulator:

1. **Start Firebase Emulators:**
   ```bash
   npm run emulators:start
   ```

2. **Set Environment Variable:**
   Create a `.env` file in the project root with:
   ```
   VITE_USE_EMULATOR=true
   ```

3. **Run Storybook:**
   ```bash
   npm run storybook
   ```

Stories that use Firebase emulators are marked with the `WithFirebaseEmulator` decorator. These stories will automatically connect to the emulators when they're running.

## Available Addons

- **@storybook/addon-docs**: Automatic documentation generation
- **@storybook/addon-a11y**: Accessibility testing
- **@storybook/addon-controls**: Interactive prop controls
- **@storybook/addon-actions**: Action logging
- **@storybook/addon-vitest**: Component testing integration

## Building Storybook

To build Storybook for deployment:

```bash
npm run build-storybook
```

The built Storybook will be in the `storybook-static` directory.

## Deployment

Storybook is automatically built and deployed to GitHub Pages on pushes to the main branch. The Storybook will be available at:

`https://[your-username].github.io/[repo-name]/storybook/`

## Writing Stories

When creating new stories:

1. Use JSDoc comments to document components
2. Organize stories using Atomic Design categories
3. Include multiple states (default, empty, error, loading, etc.)
4. Use the `withFirebaseEmulator` decorator for Firebase-dependent components
5. Add comprehensive argTypes for better controls
6. Include usage examples in the docs

Example story structure:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'Organisms/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  // ... configuration
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // ... props
  },
};
```
