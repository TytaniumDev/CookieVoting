# Contributing to Cookie Voting

Thank you for your interest in contributing!

Please refer to the following documentation for development guidelines:

- [Testing Guide](./docs/TESTING_GUIDE.md) - How to run tests (Unit, E2E, Visual).
- [Product Requirements](./docs/PRD.md) - Understanding the feature specs.
- [Storybook Setup](./docs/STORYBOOK_SETUP.md) - Working with UI components.
- [Issue Tracker](https://github.com/TytaniumDev/CookieVoting/issues) - Check for open issues.

## Development Setup

### Automated Setup (Recommended)

```bash
./scripts/setup.sh
```

### Manual Setup

If you prefer to set up the environment manually:

1.  **Prerequisites**:
    - Node.js 20+
    - Firebase CLI (`npm install -g firebase-tools`)
    - Java (for Firebase Emulators)

2.  **Install Dependencies**:
    ```bash
    # Root dependencies
    npm install

    # Backend functions dependencies
    cd functions && npm install && cd ..
    ```

3.  **Environment Configuration**:
    ```bash
    cp .env.example .env
    # Edit .env with your Firebase credentials
    ```

4.  **Run Application**:
    ```bash
    npm run dev
    ```

Please ensure all tests pass before submitting a PR.
