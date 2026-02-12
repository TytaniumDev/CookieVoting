# Tailwind CSS v4 Migration Guide

This guide helps agents migrate CSS Module files to Tailwind CSS v4 classes.

## Prerequisites

- Tailwind CSS v4.1.18 installed
- `@tailwindcss/vite` plugin configured in `vite.config.ts`
- `@import "tailwindcss"` in `src/styles/global.css`

## Migration Pattern

For each CSS Module file, follow these steps:

### 1. Read and Analyze

1. Open the `.module.css` file
2. Open the corresponding component file (`.tsx`)
3. Identify all CSS classes and their usage
4. Note any:
   - Animations (`@keyframes`)
   - Media queries
   - Pseudo-classes (`:hover`, `:focus`, etc.)
   - Complex selectors

### 2. Convert CSS to Tailwind Classes

#### Basic Conversions

| CSS Property              | Tailwind v4 Class |
| ------------------------- | ----------------- |
| `display: flex`           | `flex`            |
| `display: grid`           | `grid`            |
| `flex-direction: column`  | `flex-col`        |
| `justify-content: center` | `justify-center`  |
| `align-items: center`     | `items-center`    |
| `padding: 1rem`           | `p-4`             |
| `margin: 1rem`            | `m-4`             |
| `width: 100%`             | `w-full`          |
| `height: 100%`            | `h-full`          |
| `background-color: #fff`  | `bg-white`        |
| `color: #333`             | `text-gray-800`   |
| `border-radius: 0.5rem`   | `rounded-lg`      |
| `font-size: 1.25rem`      | `text-xl`         |
| `font-weight: 700`        | `font-bold`       |
| `box-shadow: ...`         | `shadow-md`       |

#### Custom Colors (from tailwind.config.js)

- `background-color: var(--color-bg-primary)` → `bg-background`
- `background-color: var(--color-bg-secondary)` → `bg-background-secondary`
- `background-color: #1e1e2e` → `bg-surface`
- `background-color: #2a2a3a` → `bg-surface-secondary`
- `background-color: #3a3a4a` → `bg-surface-tertiary`
- `color: #8b5cf6` → `text-primary-500`
- `color: #dc2626` → `text-accent`
- `color: #16a34a` → `text-success`
- `color: #ef4444` → `text-danger`

#### Spacing (from variables.css)

| CSS Variable            | Tailwind Class     |
| ----------------------- | ------------------ |
| `--spacing-1` (0.25rem) | `space-1` or `p-1` |
| `--spacing-2` (0.5rem)  | `space-2` or `p-2` |
| `--spacing-4` (1rem)    | `space-4` or `p-4` |
| `--spacing-6` (1.5rem)  | `space-6` or `p-6` |
| `--spacing-8` (2rem)    | `space-8` or `p-8` |

#### Responsive Design

```css
/* CSS Module */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}
```

```tsx
// Tailwind
<div className="container p-6 md:p-4">
```

Mobile-first approach:

- Base classes apply to mobile
- Use `md:`, `lg:`, `xl:` prefixes for larger screens

#### Pseudo-classes

```css
/* CSS Module */
.button:hover {
  background-color: #b91c1c;
}
```

```tsx
// Tailwind
<button className="bg-accent hover:bg-accent-hover">
```

### 3. Handle Special Cases

#### Animations

If the component uses `@keyframes` animations from `global.css`, keep using CSS Modules OR:

- Use Tailwind's built-in animations (`animate-spin`, `animate-pulse`, etc.)
- For custom animations, keep them in `global.css` and reference by name

**Example:**

```css
/* In global.css - keep this */
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* In component - use Tailwind for animation */
<div className="animate-[shimmer_2s_infinite]">
```

#### Complex Selectors

For nested selectors that don't translate well to Tailwind:

1. Use Tailwind's arbitrary variants: `[&>button]:text-red-500`
2. Or keep minimal CSS in a separate CSS file (non-module)

#### CSS Variables

If using CSS variables from `variables.css`:

- Convert to Tailwind custom colors (already in config)
- Or use arbitrary values: `bg-[var(--color-bg-primary)]`

### 4. Update Component

1. Remove CSS Module import:

   ```tsx
   // Before
   import styles from './Component.module.css';
   ```

2. Replace `styles.className` with Tailwind classes:

   ```tsx
   // Before
   <div className={styles.container}>

   // After
   <div className="flex flex-col p-4 bg-surface rounded-lg">
   ```

3. Use `cn()` utility for conditional classes:

   ```tsx
   import { cn } from '../../lib/cn';

   <div className={cn(
     "base-classes",
     isActive && "active-classes",
     className // prop override
   )}>
   ```

4. Handle dynamic classes:

   ```tsx
   // Good
   className={error ? 'text-red-500' : 'text-green-500'}

   // Bad - Tailwind can't detect dynamic class names
   className={`text-${error ? 'red' : 'green'}-500`}
   ```

### 5. Remove CSS Module File

1. Delete the `.module.css` file
2. Verify no other files import it

### 6. Test Checklist

After migration, verify:

- [ ] Component renders correctly in Storybook
- [ ] Visual appearance matches original (no layout shifts)
- [ ] Responsive design works (test mobile, tablet, desktop)
- [ ] Hover/focus states work
- [ ] Animations work (if applicable)
- [ ] Accessibility maintained (focus states, contrast)
- [ ] TypeScript compiles without errors
- [ ] No console errors
- [ ] Component works in full app context

### 7. Common Patterns

#### Modal/Overlay

```css
/* Before */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
```

```tsx
// After
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
```

#### Card Component

```css
/* Before */
.card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

```tsx
// After
<div className="bg-white rounded-lg p-6 shadow-md">
```

#### Button with States

```css
/* Before */
.button {
  padding: 0.75rem 1.5rem;
  background: #8b5cf6;
  color: white;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.button:hover {
  background: #7c3aed;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

```tsx
// After
<button className="px-6 py-3 bg-primary-600 text-white rounded-md transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
```

## Tailwind v4 Specific Features

### CSS-First Configuration

Tailwind v4 uses CSS-first configuration. The `tailwind.config.js` is still supported for complex cases.

### Theme Customization

Custom colors and spacing are defined in `tailwind.config.js` and available as:

- `bg-surface`, `bg-surface-secondary`, `bg-surface-tertiary`
- `bg-background`, `bg-background-secondary`
- `text-primary-{50-950}`, `text-accent`, `text-success`, `text-danger`
- Custom spacing follows Tailwind defaults or config

### Performance

Tailwind v4 is faster and uses CSS-first approach. The build process is optimized automatically.

## Troubleshooting

### Classes not applying?

1. Check `tailwind.config.js` has correct `content` paths
2. Verify class names are correct (typos)
3. Ensure Tailwind is imported in `global.css`
4. Check for conflicting classes (use `cn()` utility)

### Build errors?

1. Ensure `@tailwindcss/vite` is in `vite.config.ts` plugins
2. Verify `@import "tailwindcss"` is in `global.css`
3. Check `postcss.config.js` has `@tailwindcss/postcss`

### Styles not matching?

1. Use browser DevTools to inspect applied classes
2. Check for CSS specificity issues
3. Verify custom colors/spacing from config
4. Test in isolation in Storybook

## Resources

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Tailwind v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- Existing Tailwind components: Check `AdminLayout.tsx`, `CategoryCard.tsx` for examples
