---
trigger: model_decision
description: Mandatory verification rule to be followed after every code change.
---

# Verify Feature Functionality

Mandatory verification rule to be followed after every code change.

## Verification Workflow

1. **Start Emulators**: Ensure emulators are running with seed data.
   - Run: npm run emulators:start:seed
2. **Open Application**: Navigate to http://localhost:5173/ in the built-in browser.
3. **Sign In**: Click "Sign in with Test User" and verify redirect to /admin.
   - Confirm console message: "Using local test user (anonymous)".
4. **Test Feature**: Perform actions relevant to the changes. Verify UI updates, data persistence, and lack of console errors. Prefer using automated testing over built-in browser testing where possible.
5. **Debug**: Use browser dev tools (console messages) to identify and fix issues before re-testing.