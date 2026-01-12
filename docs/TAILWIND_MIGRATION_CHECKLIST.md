# Tailwind CSS v4 Migration Test Checklist

Use this checklist for each component migration to ensure quality.

## Pre-Migration

- [ ] Read the CSS Module file thoroughly
- [ ] Understand component's purpose and usage
- [ ] Check Storybook stories exist
- [ ] Note any animations or complex CSS

## During Migration

- [ ] All CSS properties converted to Tailwind classes
- [ ] Custom colors use theme values (e.g., `bg-surface`, `text-primary-600`)
- [ ] Responsive classes use mobile-first approach (`md:`, `lg:`, etc.)
- [ ] Pseudo-classes converted (e.g., `hover:`, `focus:`)
- [ ] Dynamic classes use conditional logic properly
- [ ] `cn()` utility used for complex class merging
- [ ] CSS Module import removed
- [ ] `.module.css` file deleted

## Visual Testing

### Storybook
- [ ] Component renders in Storybook
- [ ] All variants/states render correctly
- [ ] No console errors
- [ ] Visual appearance matches original

### Responsive Design
- [ ] Mobile view (< 768px) looks correct
- [ ] Tablet view (768px - 1024px) looks correct
- [ ] Desktop view (> 1024px) looks correct
- [ ] No horizontal scrolling
- [ ] Touch targets are adequate (min 44x44px on mobile)

### Interactive States
- [ ] Hover states work
- [ ] Focus states visible (accessibility)
- [ ] Active states work (buttons, links)
- [ ] Disabled states styled correctly
- [ ] Loading states styled correctly

### Animations
- [ ] Animations work as expected
- [ ] No janky or broken animations
- [ ] Animation performance is acceptable

## Integration Testing

- [ ] Component works in full app context
- [ ] No layout shifts when component loads
- [ ] Component works in different routes/pages
- [ ] Component works with other components
- [ ] No TypeScript errors
- [ ] No linting errors

## Accessibility

- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Keyboard navigation works
- [ ] Screen reader labels maintained
- [ ] ARIA attributes preserved

## Code Quality

- [ ] No inline styles (unless absolutely necessary)
- [ ] Class names are readable and maintainable
- [ ] No duplicate/unused classes
- [ ] Follows project conventions
- [ ] Code is clean and well-organized

## Final Verification

- [ ] Run `npm run build` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run test` - tests pass
- [ ] Manual testing in browser
- [ ] Component works in production build

## Notes

Document any issues, edge cases, or deviations from standard pattern:

---

**Component:** _______________
**Migrated by:** _______________
**Date:** _______________
**Task Group:** _______________
