> ⚠️ **AUTO-GENERATED** — Do not edit. Edit `ai/rules/testing-strategy.md` instead.

---
trigger: model_decision
description: Testing strategy and requirements for maintaining code quality.
---

# Testing Strategy

## Testing Pyramid

This project follows a testing pyramid adapted for React + Firebase:

```
         ▲
        /E2E\        Playwright - Critical user journeys only
       /─────\
      /Integr-\      Jest + Emulators - Backend interactions
     /──ation──\
    /Component──\    Storybook - UI components with play functions
   /─────Tests───\
  /───Unit Tests──\  Vitest - Utility functions, hooks, business logic
 /─────────────────\
/──Static Analysis──\ ESLint + TypeScript - Catches issues before runtime
```

**Principle:** More tests at the bottom (fast, cheap), fewer at the top (slow, expensive).

## Test Types & Tools

### Static Analysis (Always On)
- **ESLint**: Code quality and consistency
- **TypeScript**: Type safety
- **Run**: Happens automatically, also via `npm run lint`

### Unit Tests (Vitest)
- **Scope**: `src/lib/`, custom hooks, utility functions
- **Approach**: Test pure functions and hook logic in isolation
- **Mocking**: Mock Firebase calls; use integration tests for real Firebase behavior
- **Run**: `npm run test` or `npm run test:coverage`

### Component Tests (Storybook)
- **Scope**: All UI components in `src/components/`
- **Approach**: Use `play` functions for interaction testing
- **Required**: Every complex component needs interaction tests
- **Run**: `npm run test-storybook`

### Integration Tests (Jest + Emulators)
- **Scope**: Firestore rules, Cloud Functions, complex queries
- **Environment**: Requires `npm run emulators:start`
- **Run**: `npm run test:integration`

### E2E Tests (Playwright)
- **Scope**: Critical user journeys only
- **Examples**: Voting flow, admin event setup, authentication
- **Run**: `npm run test:e2e`

## What to Test

### Always Test
- Utility functions with logic
- Custom hooks that manage state
- Complex component interactions
- Security rules (via integration tests)
- Critical user flows (via E2E)

### Don't Over-Test
- Simple presentational components (visual review in Storybook is enough)
- Third-party library behavior
- Implementation details that might change

## Writing Good Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { calculateScore } from './scoring';

describe('calculateScore', () => {
  it('returns 0 for empty votes', () => {
    expect(calculateScore([])).toBe(0);
  });

  it('sums positive votes correctly', () => {
    expect(calculateScore([1, 2, 3])).toBe(6);
  });

  it('handles negative values', () => {
    expect(calculateScore([1, -1, 2])).toBe(2);
  });
});
```

### Component Test Example (Storybook)

```tsx
export const SubmitFlow: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvas, args }) => {
    const input = canvas.getByRole('textbox');
    const button = canvas.getByRole('button', { name: /submit/i });

    await userEvent.type(input, 'Test value');
    await button.click();

    await expect(args.onSubmit).toHaveBeenCalledWith('Test value');
  },
};
```

## Verification Workflow

Before completing any code change:

```bash
# Run full verification (mirrors CI)
npm run verify
```

This runs:
1. ESLint
2. TypeScript check
3. Unit tests
4. Build verification

**All checks must pass before considering work complete.**

## Test Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run verify` | Full verification (lint + type + test + build) |
| `npm run test` | Run unit tests |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run test-storybook` | Run Storybook interaction tests |
| `npm run test:integration` | Run integration tests (needs emulators) |
| `npm run test:e2e` | Run Playwright E2E tests |

## Debugging Test Failures

1. **Read the error message** - Often contains the fix
2. **Check recent changes** - What did you modify?
3. **Run in isolation** - Focus on the failing test
4. **Check test environment** - Emulators running? Correct node version?
5. **Fix and re-run** - Iterate until green
