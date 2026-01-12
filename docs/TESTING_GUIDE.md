# Testing Guide

This guide outlines the testing strategy and patterns for the Cookie Voting application.

## Testing Stack

- **Unit Tests**: Vitest
- **Component Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Storybook Tests**: Vitest (via test-storybook)

## Test Organization

```
tests/
├── templates/          # Test templates for common patterns
├── e2e/               # End-to-end tests (Playwright)
└── integration/       # Integration tests (Vitest + Emulators)

src/
├── lib/
│   ├── __tests__/     # Unit tests for utilities
│   └── stores/
│       └── __tests__/ # Store tests
└── components/
    └── **/__tests__/  # Component tests (co-located)
```

## Test Templates

Use the templates in `tests/templates/` as starting points:

- `store.test.template.ts` - For Zustand store tests
- `form.test.template.tsx` - For React Hook Form tests
- `component.test.template.tsx` - For React component tests

## Testing Patterns

### Store Tests

Test stores in isolation:

```typescript
import { useYourStore } from '../useYourStore';

describe('YourStore', () => {
  beforeEach(() => {
    // Reset state
    useYourStore.setState({ /* initial state */ });
  });

  it('should handle actions', () => {
    const { yourAction } = useYourStore.getState();
    // Test action
  });
});
```

### Form Tests

Test forms with React Hook Form:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should validate required fields', async () => {
  render(<YourForm />);
  const submitButton = screen.getByRole('button', { name: /submit/i });
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
```

### Component Tests

Test user interactions:

```typescript
it('should handle clicks', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick} />);
  
  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Integration tests (requires emulators)
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## TDD Workflow

1. **Write test first** - Define expected behavior
2. **Run test** - Should fail (Red)
3. **Write minimum code** - Make test pass (Green)
4. **Refactor** - Improve code while keeping tests passing

## Critical Paths to Test

### High Priority
- [ ] Voting flow (submit votes, view results)
- [ ] Admin event creation
- [ ] Admin category/baker management
- [ ] Authentication flows
- [ ] Error boundaries

### Medium Priority
- [ ] Image upload
- [ ] Cookie detection
- [ ] Store actions
- [ ] Form validations

## Coverage Goals

- **Target**: 60%+ overall coverage
- **Critical paths**: 80%+ coverage
- **Business logic**: 80%+ coverage

## Best Practices

1. **Test behavior, not implementation** - Test what the user sees/does
2. **Keep tests simple** - One assertion per test when possible
3. **Use descriptive names** - Test names should describe the scenario
4. **Mock external dependencies** - Firebase, APIs, etc.
5. **Test edge cases** - Empty states, errors, boundaries
6. **Clean up** - Reset state between tests

## Common Pitfalls

- ❌ Testing implementation details
- ❌ Over-mocking
- ❌ Testing third-party libraries
- ❌ Flaky tests (time-dependent, race conditions)
- ✅ Test user-facing behavior
- ✅ Mock only what's necessary
- ✅ Test your code, not libraries
- ✅ Use stable test data
