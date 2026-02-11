# Contributing Guide

Welcome to the CookieVoting project! This document provides guidelines for setting up your development environment and contributing to the codebase.

## Prerequisites

-   **Node.js**: v20 or higher
-   **npm**: v10 or higher
-   **Firebase CLI**: Required for deployment and emulator management (`npm install -g firebase-tools`)
-   **Java**: Required for Firebase Emulators

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/TytaniumDev/CookieVoting.git
    cd CookieVoting
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    cd functions && npm install && cd ..
    ```

3.  **Setup Environment Variables:**
    ```bash
    cp .env.example .env
    ```
    Populate `.env` with your Firebase project credentials.

4.  **Start the Development Server:**
    ```bash
    npm run dev
    ```

## Development Workflow

### Verification Script (`verify`)

We use a consolidated verification script to ensure code quality before pushing.

```bash
npm run verify
```

This script runs:
1.  **Linting**: `npm run lint`
2.  **Integration Tests**: `npm run test:integration`
3.  **Storybook Tests**: `npm run test-storybook`
4.  **Build**: `npm run build`

**Always run `npm run verify` before creating a Pull Request.**

### Testing Strategy

-   **Unit & Integration Tests**: Powered by **Vitest**.
    ```bash
    npm run test              # Run unit tests
    npm run test:integration  # Run integration tests
    ```
-   **End-to-End (E2E) Tests**: Powered by **Playwright**.
    ```bash
    npm run test:e2e          # Run E2E tests
    npm run test:e2e:ui       # Run E2E tests with UI
    ```
-   **Component Tests**: Powered by **Storybook**.
    ```bash
    npm run storybook         # Start Storybook
    npm run test-storybook    # Run interaction tests
    ```

### Local Emulators

To develop against a local Firebase instance:

```bash
npm run emulators:start
```

This starts Firestore, Auth, Storage, and Functions emulators. The frontend will automatically connect to these if `VITE_USE_EMULATOR=true` is set in your `.env`.

## CI/CD Pipeline

Our GitHub Actions workflow (`.github/workflows/deploy.yml`) handles Continuous Integration and Deployment.

-   **Tests**: Runs linting, integration tests, and Storybook tests on every push.
-   **Build**: Builds the application after tests pass.
-   **Deploy**: Deploys to Firebase Hosting (only on `main` branch).

**Note**: The CI pipeline runs checks individually for optimization, but `npm run verify` is the recommended local equivalent.

## Coding Standards

-   **Linting**: We use ESLint with strict rules.
-   **Formatting**: Prettier is enforced.
-   **Naming**:
    -   React Components: `PascalCase` (e.g., `CookieCard.tsx`)
    -   Functions/Variables: `camelCase`
    -   Files: `camelCase` or `kebab-case` (consistent within directories)

## Documentation

-   **ARCHITECTURE.md**: System design and data flow.
-   **API.md**: Backend API and database schema.
-   **README.md**: Project overview (Maintained by Showcase).

Please keep documentation updated when making architectural changes.
