import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Sandboxed environments can point at a preinstalled Chromium instead of
// Playwright's managed download (see CLAUDE.md).
const executablePath = process.env.CHROMIUM_PATH || undefined

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'jsdom',
            include: ['src/**/*.test.{ts,tsx}'],
            setupFiles: ['./src/test/setup.ts'],
          },
        },
        {
          extends: true,
          // Every story is also a test: it must render, pass its play function,
          // and pass the axe accessibility checks.
          plugins: [storybookTest({ configDir: '.storybook' })],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({ launchOptions: { executablePath } }),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  }),
)
