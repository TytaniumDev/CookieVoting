> ⚠️ **AUTO-GENERATED** — Do not edit. Edit `ai/rules/code-quality.md` instead.

---
trigger: always
description: Code quality standards for TypeScript, error handling, and maintainable code.
---

# Code Quality Standards

## TypeScript Best Practices

### Type Safety

**Avoid `any`** - It defeats the purpose of TypeScript:

```typescript
// ❌ Bad
function process(data: any) { ... }

// ✅ Good - be specific
function process(data: UserData) { ... }

// ✅ Good - use unknown if truly unknown, then narrow
function process(data: unknown) {
  if (isUserData(data)) {
    // Now TypeScript knows it's UserData
  }
}
```

**Use strict null checks:**

```typescript
// ❌ Bad - might crash
function getName(user: User) {
  return user.profile.name; // What if profile is null?
}

// ✅ Good - handle null cases
function getName(user: User) {
  return user.profile?.name ?? 'Anonymous';
}
```

### Type Definitions

**Define interfaces for all data shapes:**

```typescript
// Define clear interfaces
interface Event {
  id: string;
  name: string;
  date: Date;
  status: 'draft' | 'active' | 'completed';
}

// Use them consistently
function createEvent(data: Omit<Event, 'id'>): Event { ... }
function updateEvent(id: string, updates: Partial<Event>): void { ... }
```

**Export types that others need:**

```typescript
// types.ts
export interface Baker {
  id: string;
  name: string;
  cookies: Cookie[];
}

export type BakerStatus = 'pending' | 'approved' | 'rejected';
```

### Enums vs Union Types

**Prefer union types for simple cases:**

```typescript
// ✅ Preferred - simpler, better tree-shaking
type Status = 'loading' | 'success' | 'error';

// Use enums only when you need reverse mapping or iteration
enum HttpStatus {
  OK = 200,
  NotFound = 404,
}
```

## Error Handling

### Async/Await Errors

**Always handle promise rejections:**

```typescript
// ❌ Bad - unhandled rejection
async function fetchUser(id: string) {
  const user = await api.getUser(id);
  return user;
}

// ✅ Good - explicit error handling
async function fetchUser(id: string): Promise<User | null> {
  try {
    return await api.getUser(id);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}
```

### Error Types

**Create typed errors for better handling:**

```typescript
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Usage
throw new ValidationError('email', 'Invalid email format');
```

### React Error Boundaries

For UI errors, use error boundaries to prevent full app crashes. Handle errors gracefully with fallback UI.

## Code Organization

### Functions

**Keep functions small and focused:**

```typescript
// ❌ Bad - does too much
function processOrder(order: Order) {
  // validate
  // calculate totals
  // apply discounts
  // update inventory
  // send notifications
  // ... 200 lines later
}

// ✅ Good - single responsibility
function processOrder(order: Order) {
  validateOrder(order);
  const totals = calculateTotals(order);
  const finalPrice = applyDiscounts(totals, order.coupons);
  updateInventory(order.items);
  notifyCustomer(order, finalPrice);
}
```

### Early Returns

**Reduce nesting with early returns:**

```typescript
// ❌ Bad - deeply nested
function getDisplayName(user: User | null) {
  if (user) {
    if (user.profile) {
      if (user.profile.displayName) {
        return user.profile.displayName;
      } else {
        return user.email;
      }
    } else {
      return user.email;
    }
  } else {
    return 'Guest';
  }
}

// ✅ Good - flat with early returns
function getDisplayName(user: User | null) {
  if (!user) return 'Guest';
  if (!user.profile) return user.email;
  return user.profile.displayName || user.email;
}
```

### Constants

**Extract magic numbers and strings:**

```typescript
// ❌ Bad
if (cookies.length > 12) { ... }
if (status === 'xyz123') { ... }

// ✅ Good
const MAX_COOKIES_PER_BAKER = 12;
const STATUS_APPROVED = 'approved';

if (cookies.length > MAX_COOKIES_PER_BAKER) { ... }
if (status === STATUS_APPROVED) { ... }
```

## React-Specific Patterns

### Hooks Rules

1. Only call hooks at the top level (not in loops, conditions, or nested functions)
2. Only call hooks from React functions (components or custom hooks)
3. Custom hooks must start with `use`

### Dependency Arrays

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

### Memoization

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

## Code Review Checklist

Before considering code complete:

- [ ] TypeScript compiles with no errors
- [ ] No `any` types (or justified with comment)
- [ ] Error cases are handled
- [ ] Functions are small and focused
- [ ] Complex logic has comments explaining "why"
- [ ] No console.log statements (except intentional logging)
- [ ] No commented-out code
- [ ] Consistent naming conventions
- [ ] Tests added for new functionality
