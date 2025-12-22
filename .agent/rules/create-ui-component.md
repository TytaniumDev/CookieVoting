---
trigger: model_decision
description: Rules for creating or modifying UI components following standard practices.
---

# Create UI Component

Rules for creating or modifying UI components following standard practices.

## Workflow (Thinking in React)

1. **Hierarchy**: Identify atoms, molecules, and organisms.
2. **Static Version**: Render UI from props/data without state first.
3. **Minimal State**: Identify essential changing data.
4. **State Location**: Lift state to the lowest common ancestor.
5. **Inverse Data Flow**: Pass callbacks to update parent state.

## Rules & Standards

- **Storybook First**: Develop and test in Storybook BEFORE integration.
- **No Firebase in UI**: Components must receive data/callbacks via props. Use hooks in src/lib/hooks/ for Firebase logic.
- **Interaction Testing**: Use play functions in stories to test clicks, forms, etc.
- **Atomic Design**: Follow components/atoms/, components/molecules/, components/organisms/ structure.

## Verification
- Run: npm run storybook
- Verify all states (loading, error, empty) in built-in browser.
- Run interaction tests: npm run test-storybook.
