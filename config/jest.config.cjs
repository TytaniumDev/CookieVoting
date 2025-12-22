module.exports = {
  rootDir: '..',
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/config/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/e2e/', // Ignore E2E tests (handled by Playwright)
  ],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '^uuid$': require.resolve('uuid'),
  },
  // Configure for integration tests
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'esnext',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          target: 'ES2020',
          lib: ['ES2020', 'DOM'], // Include DOM types for browser APIs
          types: ['node', 'jest'],
          skipLibCheck: true,
        },
      },
    ],
  },
  // Mock import.meta in transformed code
  transformIgnorePatterns: [],
};
