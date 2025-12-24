---
trigger: always
description: Test-Driven Development workflow and testing requirements for all code changes.
---

# Testing Strategy

## Test-Driven Development (TDD) Workflow

**This project follows strict Test-Driven Development.** Write tests BEFORE implementation code.

### The TDD Cycle

For every code change, follow this cycle:

1. **Propose test cases first** - Before writing any implementation, outline the test cases you plan to write
2. **Clarify ambiguities** - If requirements are unclear, ASK the user before proceeding
3. **Write the tests** - Create failing tests that define expected behavior.
4. **Run tests (expect failures)** - Confirm tests fail as expected
5. **Implement the code** - Write the minimum code to make tests pass. Follow guidance in `testing-strategy.md` for test case quality standards.
6. **Run tests again** - Verify all tests pass
7. **Refactor** - Clean up code while keeping tests green
8. **Repeat** - Continue until all functionality is complete and tests pass

### Proposing Test Cases

Before writing tests, present a test plan to the user that includes:

```markdown
## Proposed Test Cases for [Feature/Function]

### Happy Path
- [ ] Test case 1: [description of expected behavior]
- [ ] Test case 2: [description of expected behavior]

### Edge Cases
- [ ] Empty input handling
- [ ] Boundary values (min/max)
- [ ] Invalid input types
- [ ] Null/undefined handling

### Error Cases
- [ ] Network failures
- [ ] Permission denied
- [ ] Invalid state transitions
```

**Ask for clarification if:**
- Requirements are ambiguous or incomplete
- Edge case behavior is not specified
- Error handling expectations are unclear
- Performance requirements are not defined

### Test Case Quality Standards

Write tests that are:
- **Readable** - Test names describe the behavior, not implementation
- **Maintainable** - Avoid testing implementation details
- **Thorough** - Cover happy paths, edge cases, and error conditions
- **Independent** - Tests should not depend on each other

```typescript
// ❌ Bad - tests implementation details
it('calls setLoading with true then false', () => { ... });

// ✅ Good - tests behavior
it('shows loading spinner while fetching data', () => { ... });
it('displays error message when fetch fails', () => { ... });
```

### When to Skip TDD

TDD is **required** for:
- New utility functions
- Custom hooks
- Business logic
- API integrations
- Complex component interactions

TDD may be **relaxed** for:
- Simple presentational components (use Storybook visual review)
- Configuration changes
- Documentation updates
- Refactoring with existing test coverage

---

**See also:** `testing-strategy.md` for test commands, tooling, and code examples.
