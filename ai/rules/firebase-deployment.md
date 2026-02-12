---
trigger: model_decision
description: Guidelines for Firebase deployments - when and how to deploy functions and security rules.
---

# Firebase Deployment Guidelines

## Deployment Safety

**Never deploy without verification.** Always:

1. Run `npm run verify` to ensure code quality
2. Test changes locally first
3. Confirm the deployment is intentional

## When to Deploy

### Cloud Functions (`functions/src/`)

Deploy after modifying:

- TypeScript files in `functions/src/`
- Function dependencies in `functions/package.json`
- TypeScript config in `functions/tsconfig.json`

**Command:** `npm run firebase:deploy:functions`

### Security Rules

Deploy after modifying:

- `firebase/firestore.rules` → `npm run firebase:deploy:firestore`
- `firebase/storage.rules` → `npm run firebase:deploy:storage`
- Both → `npm run firebase:deploy:rules`

## When NOT to Deploy

Do not trigger deployment for:

- Documentation changes (`.md` files)
- Frontend-only changes (`src/` except functions)
- Test file changes (unless they reveal function bugs)
- Storybook or story changes

## Pre-Deployment Checklist

### For Functions:

- [ ] TypeScript compiles without errors: `npm run build --prefix functions`
- [ ] Related unit tests pass
- [ ] Tested against local dev environment
- [ ] Changes reviewed for security implications

### For Security Rules:

- [ ] Rules syntax is valid (no `if`, `const`, `let`)
- [ ] Tested read/write scenarios
- [ ] No unintended permission changes

## Firestore Rules Syntax

Firestore rules have unique syntax requirements:

```javascript
// ❌ WRONG - if statements not supported
if (request.auth != null) {
  allow read;
}

// ✅ CORRECT - use ternary or boolean expressions
allow read: if request.auth != null;

// ❌ WRONG - no variable declarations
let userId = request.auth.uid;

// ✅ CORRECT - inline expressions
allow write: if request.auth.uid == resource.data.ownerId;

// ✅ Use && and || for complex conditions
allow update: if request.auth != null
              && request.auth.uid == resource.data.ownerId
              && request.resource.data.status in ['draft', 'published'];
```

## Available Scripts

| Script                              | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `npm run firebase:deploy:functions` | Build and deploy Cloud Functions        |
| `npm run firebase:deploy:firestore` | Deploy Firestore security rules         |
| `npm run firebase:deploy:storage`   | Deploy Storage security rules           |
| `npm run firebase:deploy:rules`     | Deploy both Firestore and Storage rules |

## Troubleshooting Deployments

### Function Deployment Fails

1. Check TypeScript compilation: `npm run build --prefix functions`
2. Look for missing dependencies
3. Check for runtime vs build-time errors
4. Verify Firebase project configuration

### Rules Deployment Fails

1. Check for syntax errors (no `if`, `const`, `let`)
2. Validate rule structure
3. Test in Firebase console rules playground

## Post-Deployment

After successful deployment:

1. Verify the deployment in Firebase Console
2. Test critical functionality in production
3. Monitor for errors in Firebase Functions logs
