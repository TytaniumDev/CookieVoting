---
trigger: model_decision
description: This rule provides instructions for automatically deploying Firebase Firestore and Storage security rules after modification.
---

# Deploy Firebase Security Rules

This rule provides instructions for automatically deploying Firebase Firestore and Storage security rules after modification.

## Trigger Conditions

The agent should automatically deploy Firebase rules when:

1. **Firestore Rules Modified** (firestore.rules)
2. **Storage Rules Modified** (storage.rules)

## Deployment Process

1. **Verify Syntax**: Check for logic errors or syntax issues.
   - Note: Firestore rules do NOT support if (use ternary), const/let, or multi-line conditionals.
2. **Deployment Command**:
   - Both Rules: npm run firebase:deploy:rules
   - Firestore Only: npm run firebase:deploy:firestore
   - Storage Only: npm run firebase:deploy:storage
3. **Verification**: Confirm deployment success in output and notify the user.

## Error Handling

If deployment fails, fix syntax errors and retry automatically.
