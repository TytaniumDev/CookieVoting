import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
  ],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  docs: {
    autodocs: 'tag',
  },
  // Organize components using Atomic Design principles
  // Atoms: Basic building blocks (buttons, inputs, etc.)
  // Molecules: Simple combinations (form fields, etc.)
  // Organisms: Complex components (ImageWithDetections, ImageTagger, etc.)
  // Templates: Page-level layouts (Layout)
  features: {
    buildStoriesJson: true,
  },
};
export default config;
