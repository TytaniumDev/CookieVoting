---
trigger: model_decision
description: This rule provides instructions for automatically deploying Firebase Cloud Functions after changes to function code or configuration.
---

# Deploy Firebase Cloud Functions

This rule provides instructions for automatically deploying Firebase Cloud Functions after changes to function code or configuration.

## Trigger Conditions

The agent should automatically deploy Firebase Functions when:
1. **Function Source Code Changes** (functions/src/)
2. **Function Dependencies Changes** (functions/package.json)
3. **TypeScript Config Changes** (functions/tsconfig.json)

## Deployment Process

1. **Verify Compilation**: Before deploying, ensure the functions compile without errors.
   - Run: npm run build --prefix functions
2. **Deployment Command**:
   - Use: npm run firebase:deploy:functions
   - This command automatically builds and deploys the functions (npm run build --prefix functions && firebase deploy --only functions).
3. **Verification**: Verify deployment success in output and notify the user.

## Error Handling
If deployment fails, fix syntax/compilation errors and retry automatically.
