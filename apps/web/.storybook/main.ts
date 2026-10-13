import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
  // Real plate photos for stories that show cookies (served at /plates/<file>).
  staticDirs: [{ from: '../../../fixtures/plates', to: '/plates' }],
  core: { disableTelemetry: true },
}

export default config
