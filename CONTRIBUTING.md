# Contributing to Cookie Voting

Welcome! We love contributions. This guide will help you get started with the Cookie Voting project.

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Java** (required for Firebase Emulators)

### Installation

1.  **Clone and Install:**

    ```bash
    git clone https://github.com/TytaniumDev/CookieVoting.git
    cd CookieVoting
    npm install
    cd functions && npm install && cd ..
    ```

2.  **Environment Setup:**

    ```bash
    cp .env.example .env
    # Update .env with your Firebase credentials if needed
    ```

3.  **Run Locally:**
    ```bash
    npm run dev
    ```

## 🧪 Testing

We use a comprehensive testing strategy involving Vitest, Playwright, and Storybook.

| Type            | Command                    | Description                                     |
| :-------------- | :------------------------- | :---------------------------------------------- |
| **Unit**        | `npm run test`             | Runs unit tests for logic and hooks.            |
| **Integration** | `npm run test:integration` | Runs integration tests against local emulators. |
| **E2E**         | `npm run test:e2e`         | Runs end-to-end tests with Playwright.          |
| **Storybook**   | `npm run storybook`        | Develops UI components in isolation.            |

For detailed guides, please read:

- [Testing Guide](./docs/TESTING_GUIDE.md)
- [Emulator Setup](./docs/EMULATOR_SETUP.md)
- [Storybook Setup](./docs/STORYBOOK_SETUP.md)

## 🛠️ Development Workflow

1.  **Branching:** Create a feature branch for your changes.
2.  **Coding Standards:** We follow strict TypeScript and React patterns. See [CLAUDE.md](./CLAUDE.md) for AI-enforced rules.
3.  **Verification:** Always run `npm run verify` before pushing. This runs linting, type checking, and tests.

## 🤝 Submitting Changes

1.  Push your branch.
2.  Open a Pull Request against `main`.
3.  Ensure all CI checks pass.

Thank you for contributing!
