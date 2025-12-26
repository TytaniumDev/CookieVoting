---
trigger: always
description: TDD workflow and testing strategy - tests before code, verification requirements.
---

# Testing Strategy & TDD Workflow

## 1. TDD Workflow (Required)
**Follow strict Test-Driven Development:**

1. **Propose Test Cases**: Before coding, outline what you will test.
2. **Clarify**: Ask user if requirements are ambiguous.
3. **Write Tests**: Create failing tests defining expected behavior.
4. **Red**: Confirm tests fail.
5. **Green**: Write minimum code to pass.
6. **Refactor**: improve code while keeping tests passing.

### Test Plan Template
Use this to propose tests to the user:
```markdown
## Proposed Test Cases for [Feature]
### Happy Path
- [ ] [Description]
### Edge/Error Cases
- [ ] Empty/Null inputs
- [ ] Network failures / Permission denied
```

## 2. Testing Pyramid & Tools

| Layer | Tool | Scope | Command |
|-------|------|-------|---------|
| **E2E** | Playwright | Critical user flows | `npm run test:e2e` |
| **Integration** | Vitest + Emulators | Firestore rules, Functions | `npm run test:integration` |
| **Component** | Storybook | UI interactions (`play` functions) | `npm run test-storybook` |
| **Unit** | Vitest | Logic, Hooks, Utils | `npm run test` |
| **Static** | ESLint/TSC | Code quality, Types | `npm run verify` |

## 3. What to Test
- **Unit**: Complex logic, custom hooks, utils. Mock dependencies with `vi.mock()`.
- **Component**: User interactions (clicks, forms). Don't test style details.
- **Integration**: Security rules, backend triggers (use Emulators).
- **Skip**: Simple presentational components, 3rd party config.

## 4. Vitest Best Practices

### Mocking
```typescript
import { vi, type Mock } from 'vitest';

vi.mock('../lib/firestore');
const mockedFn = someFn as Mock;
mockedFn.mockResolvedValue({ id: '123' });
```

### Cleanup
```typescript
afterEach(() => {
  vi.clearAllMocks();
});
```

## 5. Verification
Run `npm run verify` before *every* commit. It runs lint, types, tests, and build checks.

### Debugging
- Check error message -> Check recent changes -> Run in isolation.
- Use `npm run test:watch` for interactive development.
- Ensure Emulators are running for integration tests (`npm run emulators:start`).
