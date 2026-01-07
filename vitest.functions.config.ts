import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'functions',
    environment: 'node',
    include: ['functions/src/**/*.test.ts'],
    globals: true,
  },
});
