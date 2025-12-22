# Testing Strategy & Roadmap

This document outlines the testing strategy for the CookieVoting project, aiming to ensure high reliability, maintainability, and confidence in deployments.

## 1. Testing Pyramid & Philosophy

We follow a modified testing pyramid adapted for our Firebase + React stack:

1.  **Static Analysis (Linting & Types)**: First line of defense. Strict TypeScript and ESLint rules prevent common errors.
2.  **Unit Tests (`src/lib`, `functions`)**: Fast, isolated tests for utility functions, hooks, and complex business logic (e.g., cookie detection algorithms).
3.  **Component Tests (Storybook)**: "Interaction Tests" using Storybook's `play` function. These serve as our primary UI tests, verifying rendering and state changes in isolation.
4.  **Integration Tests (Firebase Emulators)**: Tests that verify interactions with the Firebase backend (Firestore, Auth, Storage, Functions) running in the local emulator suites.
5.  **E2E Tests (Playwright)**: Critical user journey tests running against the full application stack (or emulated equivalent).

## 2. Current Status & Coverage

- **Unit**: Covered via Vitest. Coverage is enabled (`npm run test:coverage`).
- **Integration**: `tests/integration` folder contains Jest tests running against Firebase Emulator.
- **UI/Component**: Storybook is configured with `addon-interactions`. Key components (`VotingSessionView`, `CookieViewer`) have interaction tests.
- **E2E**: Playwright is configured.

## 3. Detailed Strategy

### A. Unit Tests

- **Scope**: `src/lib/`, `src/hooks/`, `functions/src/`.
- **Tool**: Vitest.
- **Goal**: 80%+ coverage on `src/lib` logic.
- **Mocking**: Mock Firebase calls in unit tests; use Integration tests for real Firebase behavior.

### B. Component Interaction Tests (Storybook)

- **Scope**: All "Organism" level components (`VotingSessionView`, `ImageTagger`, `EventSetupWizard`).
- **Tool**: Storybook + `@storybook/addon-interactions`.
- **Requirement**: Every complex interactive component MUST have a `ValidUserJourney` story that simulates a successful interaction (click, type, submit).
- **Accessibility**: Use `storybook-addon-a11y` to catch basic accessibility issues.

### C. Integration Tests

- **Scope**: Firebase security rules, Cloud Functions triggers, and complex Firestore queries.
- **Tool**: Jest + `@firebase/rules-unit-testing`.
- **Environment**: `npm run emulators:start`.
- **Key Scenarios**:
  - User can only vote once per event.
  - Admins can create/edit events.
  - Cloud functions correctly process image detections.

### D. E2E Tests

- **Scope**: Full application flows.
- **Tool**: Playwright.
- **Key Journeys**:
  1.  **Voter Journey**: Land -> Vote -> Wait -> See Results.
  2.  **Admin Journey**: Login -> Create Event -> Tag Cookies -> Publish.

## 4. Improvement Plan (Next Steps)

1.  **Expand Interaction Tests**:
    - Add tests for `AdminDashboard` (creation, deletion flows).
    - Add failure case stories (e.g., "Network Error").

2.  **Enhance Integration Coverage**:
    - Test Cloud Functions failure modes.
    - Test Security Rules for "Results Viewing" (ensure strictly locked until time).

3.  **Automated Coverage Reporting**:
    - Integrate coverage reports into PR comments (if possible in future CI/CD).
    - Fail build if coverage drops significantly.

4.  **Refactor Legacy Components**:
    - `AdminDashboard.tsx` is too large. Refactor into `CategoryManager`, `BakerManager` to make it testable in Storybook.

## 5. Running Tests

- **All (Verify)**: `npm run verify`
- **Unit/Coverage**: `npm run test:coverage`
- **Storybook**: `npm run test-storybook`
- **Integration**: `npm run test:integration`
- **E2E**: `npm run test:e2e`
