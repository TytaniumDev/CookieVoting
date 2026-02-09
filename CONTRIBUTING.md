# Contributing to CookieVoting

Thank you for your interest in contributing!

## Getting Started

1.  **Setup**: Please follow the Quick Start guide in the [README.md](./README.md).
2.  **Environment**: Ensure you have Node.js 20+ and the Firebase CLI installed.

## Development Workflow

### Architecture
Before making changes, please read the [Architecture Guide](./docs/ARCHITECTURE.md) to understand the system design, especially the Cookie Detection Pipeline.

### Code Style
We use ESLint and Prettier.
-   Run `npm run lint` to check for issues.
-   Run `npm run format` to fix formatting.

### Testing
We use Vitest (Unit/Integration) and Playwright (E2E).
-   **Unit Tests**: `npm run test`
-   **Integration Tests**: `npm run test:integration`
-   **E2E Tests**: `npm run test:e2e`
-   **Full Verification**: `npm run verify` (Runs all checks).

## Documentation
-   **Scribe's Rule**: If you change code logic, you must update the corresponding documentation.
-   **New Features**: Must have accompanying tests and documentation updates.
