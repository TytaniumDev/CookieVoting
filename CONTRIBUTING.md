# Contributing Guide

Welcome to the Cookie Voting project! This guide will help you set up your development environment and understand our workflow.

## Prerequisites

- **Node.js**: Version 20 or higher.
- **Java**: Required for running Firebase Emulators (local backend).
- **Firebase CLI**: Install globally via `npm install -g firebase-tools`.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd cookievoting
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Initial Setup:**
    Run the setup script to configure your environment variables and emulators.
    ```bash
    npm run setup
    ```

## Development Workflow

We use a dual-terminal workflow: one for the frontend and one for the backend emulators.

### 1. Start the Backend (Emulators)
In your first terminal, start the Firebase Emulators. This spins up local instances of Firestore, Auth, Functions, and Storage.
```bash
npm run emulators:start
```
*Wait for the emulators to report "All emulators ready" before starting the frontend.*

### 2. Start the Frontend (Vite)
In a second terminal, start the React development server.
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Testing

We maintain a rigorous testing culture. Please review `docs/TESTING_GUIDE.md` for detailed patterns.

### Unit & Component Tests
Powered by [Vitest](https://vitest.dev/).
```bash
npm test
```

### Integration Tests
Tests that run against the local emulators to verify backend logic.
```bash
npm run test:integration
```
*Ensure emulators are running or use `npm run test:integration:emulator`.*

### End-to-End (E2E) Tests
Powered by [Playwright](https://playwright.dev/).
```bash
npm run test:e2e
```

### Visual Testing
Powered by [Storybook](https://storybook.js.org/).
```bash
npm run storybook
```

## Code Quality

We enforce strict linting and formatting rules.

- **Linting:** `npm run lint` (ESLint)
- **Formatting:** `npm run format` (Prettier)

**Note:** The pre-commit/pre-push hooks will automatically run `scripts/sync-agent-rules.sh` to ensure AI agent rules are up to date.

## Commit Guidelines

- Use descriptive commit messages.
- Keep commits atomic (one feature/fix per commit).
- Create feature branches for new work (`feat/my-feature` or `fix/issue-123`).

## Project Structure

- `src/`: Frontend React application.
- `functions/`: Cloud Functions backend.
- `firebase/`: Firebase configuration and rules.
- `docs/`: Technical documentation.
- `tests/`: Integration and E2E test suites.
