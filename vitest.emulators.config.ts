import { defineConfig } from 'vitest/config'

// Tests that need the Firebase emulators. Run them with `npm run test:emulators`,
// which starts the emulators (and loads the built functions) around this run.
export default defineConfig({
  test: {
    include: ['firebase/tests/**/*.test.ts', 'functions/test/**/*.emulator.test.ts'],
    // The files share one set of emulators, so run them one at a time.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
