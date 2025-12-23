> ⚠️ **AUTO-GENERATED** — Do not edit. Edit `ai/rules/react-patterns.md` instead.

---
trigger: model_decision
description: React-specific patterns, hooks rules, and performance optimization.
---

# React Patterns

## Hooks Rules

1. Only call hooks at the top level (not in loops, conditions, or nested functions)
2. Only call hooks from React functions (components or custom hooks)
3. Custom hooks must start with `use`

## Dependency Arrays

**Be explicit and complete:**

```typescript
// ❌ Bad - missing dependency
useEffect(() => {
  fetchUser(userId);
}, []); // userId should be in deps

// ✅ Good - all dependencies listed
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// ✅ Good - use useCallback for stable references
const handleSubmit = useCallback(() => {
  submitForm(formData);
}, [formData]);
```

## Memoization

**Memoize expensive operations, not everything:**

```typescript
// ✅ Good use - expensive calculation
const sortedItems = useMemo(
  () => items.sort((a, b) => b.score - a.score),
  [items]
);

// ❌ Unnecessary - simple value
const isActive = useMemo(() => status === 'active', [status]);
// Just use: const isActive = status === 'active';
```

## Component Patterns

### Container/Presenter

Separate data fetching from presentation:

```typescript
// Presenter - pure UI, receives everything via props
function UserProfileView({ user, onEdit, isLoading }: Props) {
  if (isLoading) return <Spinner />;
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={onEdit}>Edit</button>
    </div>
  );
}

// Container - handles data and logic
function UserProfile({ userId }: { userId: string }) {
  const { user, isLoading } = useUser(userId);
  const handleEdit = () => { /* ... */ };
  return <UserProfileView user={user} onEdit={handleEdit} isLoading={isLoading} />;
}
```

### Compound Components

For related components that share context:

```typescript
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.card}>{children}</div>
);

Card.Header = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.header}>{children}</div>
);

Card.Body = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.body}>{children}</div>
);

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

## State Management

### Local vs Lifted State

- **Local state**: UI-only concerns (open/closed, hover, focus)
- **Lifted state**: Shared between siblings (form data, selections)
- **Global state**: App-wide concerns (auth, theme, notifications)

### Avoid Prop Drilling

When passing props through many levels:
1. First, try lifting state to a closer common ancestor
2. Consider using context for truly global state
3. Use Zustand for complex state that many components need

## React Checklist

- [ ] Components receive data via props (no direct Firebase)
- [ ] Hooks follow rules (top-level, proper dependencies)
- [ ] Memoization used only where needed
- [ ] State lives at the appropriate level
