import { defineConfig } from 'vitest/config'

// Unit tests only; test/*.emulator.test.ts run via `npm run test:emulators` at the root.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
})
