# Contributing to Cookie Voting

Thank you for your interest in contributing to Cookie Voting! We welcome contributions from everyone.

## Getting Started

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/CookieVoting.git
    cd CookieVoting
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    cd functions && npm install && cd ..
    ```
4.  **Set up environment**:
    Copy `.env.example` to `.env` and fill in your Firebase credentials.
    ```bash
    cp .env.example .env
    ```

## Development Workflow

-   **Start Development Server**: `npm run dev` (starts Vite on port 5173)
-   **Run Tests**: `npm test` (runs Vitest unit tests)
-   **Run Storybook**: `npm run storybook` (starts Storybook on port 6006)
-   **Run End-to-End Tests**: `npm run test:e2e` (runs Playwright tests)

## Pull Requests

1.  Create a new branch for your feature or fix: `git checkout -b feature/my-new-feature`
2.  Make your changes.
3.  Run verification script to ensure no regressions: `npm run verify`
4.  Commit your changes using conventional commits (e.g., `feat: add new voting category`).
5.  Push your branch and open a Pull Request.

## Documentation

For more detailed information, please refer to:

-   [Testing Guide](./docs/TESTING_GUIDE.md)
-   [Storybook Setup](./docs/STORYBOOK_SETUP.md)
-   [Architecture](./docs/ARCHITECTURE.md)
-   [Emulator Setup](./docs/EMULATOR_SETUP.md)
