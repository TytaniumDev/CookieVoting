---
trigger: model_decision
description: Standards for building, testing, and documenting UI components in Storybook.
---

# UI Component Creation Standards

## Core Principles of Reusable React Components

When developing or modifying UI components, follow these three core principles: **modularity**, **maintainability**, and **flexibility**. These ensure components remain adaptable, easy to manage, and reusable across projects.

### 1. Single Responsibility Principle
- Each component should have **one clear purpose** and handle a single responsibility.
- Break down complex UIs into smaller, manageable sub-components.
- If a component is doing too much, split it into multiple focused components.

### 2. Separation of Concerns
- UI components should be **modular** and **reusable**.
- **Do NOT include business logic** (e.g., data fetching, external side effects) inside reusable components.
- Components should accept all necessary state or data via props and should not depend on global state or app-specific logic.
- Use patterns like **Container/Presenter** or **Custom Hooks** to separate logic from presentation.

### 3. NO Firebase Dependencies in UI Components
- **UI components MUST NEVER directly import or use Firebase services** (auth, db, storage, functions).
- **Components should receive all data and callbacks via props** instead of fetching data themselves.
- Firebase logic belongs in:
  - Custom hooks (e.g., `useAuth`, `useImageDetections`) in `src/lib/hooks/`
  - Utility functions in `src/lib/firestore.ts`, `src/lib/storage.ts`, etc.
  - Parent components or pages that use the hooks and pass data/callbacks to UI components

## Storybook Development Workflow

### 1. ALWAYS Build in Storybook First
- All new UI components and widgets MUST be created and thoroughly tested in Storybook BEFORE integration into the application.
- Use the built-in browser to interactively verify **all behaviors** and **visuals** in Storybook.

### 2. Testability and Testing
- **All component states must be demonstrable in Storybook.**
- If your component has disabled, error, loading, empty, selected, or interactive states, **create a dedicated Story for each one**.
- Since components don't use Firebase directly, you can pass mock data/callbacks in stories without any Firebase setup.

### 3. Storybook Testing Framework
- **ALWAYS add interaction tests** using `play` functions for interactive components.
- Use `play` functions to test user interactions like clicks, form submissions, and state changes.
- Import testing utilities from `storybook/test`: `import { fn, expect } from 'storybook/test'`
- Use `fn()` to create mock functions that can be spied on: `onClick: fn()`

Example:
```tsx
export const Interactive: Story = {
  args: {
    onClick: fn(),
  },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button');
    await button.click();
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

## Component Design Patterns

### Atomic Design Methodology
Organize components into a hierarchical structure:

- **Atoms**: Smallest, indivisible elements (buttons, inputs, labels, icons)
- **Molecules**: Groups of atoms that work together (search bar = input + button)
- **Organisms**: Complex UI sections made of molecules (navigation bar, form sections)

**Project Structure:**
```
components/
  atoms/
    Button/
    Input/
    Label/
  molecules/
    SearchBar/
    FormField/
  organisms/
    Navigation/
    Card/
```

## Accessibility (A11y)

**Components MUST be accessible by default:**

- **Semantic HTML**: Use appropriate HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- **ARIA Attributes**: Add ARIA labels, roles, and states when semantic HTML isn't sufficient
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **Focus Management**: Properly manage focus states and focus trapping in modals
- **Color Contrast**: Meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
