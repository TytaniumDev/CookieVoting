---
trigger: model_decision
description: Rules for creating or modifying tests following the project's testing strategy.
---

# Create Tests

Rules for creating or modifying tests following standard practices outlined in `TESTING_STRATEGY.md`.

## Testing Pyramid & Philosophy

Follow the modified testing pyramid adapted for the Firebase + React stack:

1.  **Static Analysis**: First line of defense.
2.  **Unit Tests (`src/lib`, `functions`)**: Fast, isolated logic tests using Vitest.
3.  **Component Tests (Storybook)**: **REQUIRED** for UI. Use `play` functions for user interactions.
4.  **Integration Tests (Firebase Emulators)**: Verify backend interactions using Jest.
5.  **E2E Tests (Playwright)**: Critical user full-stack journeys.

## Rules & Standards

### Unit Tests

- **Scope**: `src/lib/`, `src/hooks/`, `functions/src/`.
- **Mocking**: Mock Firebase calls. Use Integration tests for real behavior.
- **Coverage Goal**: Aim for high coverage on utility logic.

### Component Interaction Tests (Storybook)

- **Tool**: Storybook + `@storybook/addon-interactions`.
- **Requirement**: Every complex interactive component MUST have a `ValidUserJourney` story simulating a successful interaction.
- **Accessibility**: Use `storybook-addon-a11y`.

### Integration Tests

- **Environment**: Must run against `npm run emulators:start`.
- **Scope**: Security rules, triggers, complex queries.

### E2E Tests

- **Tool**: Playwright.
- **Focus**: Critical user journeys (e.g., Voting Flow, Admin Event Setup).

## Verification

- **Unit/Coverage**: `npm run test:coverage`
- **Storybook**: `npm run test-storybook`
- **Integration**: `npm run test:integration`
- **E2E**: `npm run test:e2e`
- **All**: `npm run verify`
