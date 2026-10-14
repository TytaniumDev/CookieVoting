import { defineConfig, devices } from '@playwright/test'

const port = 4173
const executablePath = process.env.CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  // Voters are on phones; admins will be too (see docs/ARCHITECTURE.md). CI runs each
  // project on its own runner by setting E2E_PROJECT.
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ].filter((p) => !process.env.E2E_PROJECT || p.name === process.env.E2E_PROJECT),
  // Specs expect the emulators running with seed data: run them via `npm run test:e2e`
  // at the repo root, which wraps this in `firebase emulators:exec` and seeds first.
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    env: { VITE_USE_EMULATORS: 'true' },
    port,
    reuseExistingServer: !process.env.CI,
  },
})
