---
trigger: always
description: Core project guidelines and development standards for the CookieVoting project.
---

# Project Guidelines & Standards

These are the core development practices for this project. Follow these guidelines for all code changes.

## Architecture Principles

### React Best Practices

Follow the "Thinking in React" methodology:

1. **Break UI into components** - Identify component hierarchy from the design
2. **Build a static version first** - Render UI without interactivity initially
3. **Identify minimal state** - Determine the absolute minimum state needed
4. **Determine state ownership** - Place state in the lowest common ancestor
5. **Add data flow** - Pass callbacks down for child-to-parent communication

### Separation of Concerns

- **UI components are presentation-only** - They receive data via props, never fetch it
- **Business logic lives in hooks** - Custom hooks in `src/lib/hooks/` handle data fetching, state management, and side effects
- **Utilities are pure functions** - Complex logic (sorting, calculations, formatting) goes in `src/lib/` utilities
- **No Firebase in components** - Components must NEVER import Firebase directly. All Firebase interactions happen through hooks

### Project Structure

```
src/
├── components/
│   ├── atoms/        # Basic UI primitives (Button, Input, Modal)
│   ├── molecules/    # Combinations of atoms (SearchBar, FormField)
│   └── organisms/    # Complex sections (Navigation, Forms)
├── pages/            # Route-level components
├── lib/
│   ├── hooks/        # Custom React hooks (useAuth, useEvent, etc.)
│   ├── stores/       # Zustand state stores
│   ├── firebase.ts   # Firebase initialization
│   ├── firestore.ts  # Firestore utilities
│   └── storage.ts    # Storage utilities
└── stories/          # Storybook stories and test data
```

## Code Standards

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CookieViewer.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_COOKIES` |
| Props/Variables | camelCase | `isLoading`, `onClick` |

### File Organization

- **One component per file** - Component name matches filename
- **Co-locate related files** - Keep `.module.css`, `.stories.tsx`, and `.test.tsx` near their component
- **Index exports** - Use `index.ts` for clean imports from directories

## Development Workflow

### Before Making Changes

1. Understand the existing code patterns in the area you're modifying
2. Check for similar implementations elsewhere in the codebase
3. Consider if your change requires new tests

### Before Committing

**Always run `npm run verify`** before considering work complete. This runs:
- ESLint for code quality
- TypeScript for type checking  
- Vitest for unit tests
- Build verification

Fix ALL warnings and errors before reporting completion.

### Storybook-First Development

For UI components:
1. Create the component in Storybook first
2. Add stories for all states (default, loading, error, empty, disabled)
3. Add interaction tests using `play` functions
4. Only then integrate into the application

## Firebase Guidelines

### Security Rules Syntax

Firestore rules have specific limitations:
- ❌ No `if` statements - use ternary operators instead
- ❌ No `const` or `let` - use inline expressions
- ✅ Use `&&` and `||` for complex conditions

### Local Development

- **Start emulators**: `npm run emulators:start:seed`
- **Test user**: `test@local.dev` (UID: `test-user-default`) has admin access
- **Windows users**: Use `127.0.0.1` instead of `localhost` to avoid IPv6 issues

## Accessibility Requirements

All UI must be accessible:
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- Add ARIA labels where visual context is insufficient
- Ensure keyboard navigation works for all interactive elements
- Add `data-testid` attributes for testing
