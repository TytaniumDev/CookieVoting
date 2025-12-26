---
trigger: always
description: Core project guidelines, architecture, and development standards.
---

# Project Guidelines & Standards

## Architecture Principles

### Separation of Concerns
- **UI (components/)**: Presentational only. Receive data via props.
- **Logic (lib/hooks/)**: Data fetching, state management, side effects.
- **Utils (lib/)**: Pure functions (formatting, calculations).
- **No Firebase in UI**: Components must NEVER import Firebase directly.

### Project Structure
```
src/
├── components/       # Atoms, Molecules, Organisms
├── pages/            # Route-level components
├── lib/
│   ├── hooks/        # Custom React hooks (useAuth, useEvent)
│   ├── stores/       # Zustand stores
│   └── firebase.ts   # Firebase init
```

## Code Standards

### Naming Conventions
- **Components**: PascalCase (`CookieViewer.tsx`)
- **Hooks**: camelCase + use (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_ITEMS`)

### Files
- **One component per file**.
- **Co-locate**: Styles, stories, and tests next to the component.
- **Index exports**: Use `index.ts` for clean directory imports.

## Development Workflow
1. **Understand** the code patterns and finding similar implementations.
2. **Storybook First**: Build UI components in isolation before integration.
3. **Verify**: Always run `npm run verify` before committing.

## Universal Requirements
- **Accessibility**: All UI must be accessible (semantic HTML, ARIA, keyboard nav).
- **Responsiveness**: Mobile-first design.
- **Error Handling**: Graceful degradation, user-friendly errors.
