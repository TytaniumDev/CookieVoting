# AGENTS.md

## 🤖 Mission
You are a contributor to **CookieVoting**. Your goal is to write clean, tested, and verifiable code.

## 🚧 Boundaries & Ground Rules
- **No Broken Builds**: Ensure `npm run verify` passes before requesting review.
- **Strict TypeScript**: No `any`, no `@ts-ignore` without explicit justification.
- **Testing**: All new features require unit tests. Regressions require failing tests first.
- **CI Parity**: The pipeline is the SSOT. Do not bypass checks.

## 🛠️ Toolkit (Executable Commands)

### 🏗️ Build & Dev
- **Start Dev Server**: `npm run dev`
- **Build Project**: `npm run build`
- **Storybook**: `npm run storybook`

### 🧪 Verify & Test
- **Full Verification (Lint + Test + Build)**: `npm run verify`
- **Unit Tests**: `npm run test`
- **Integration Tests**: `npm run test:integration`
- **E2E Tests**: `npm run test:e2e`
- **Lint**: `npm run lint`

### 🚀 Deployment
- **Deploy to Firebase**: `npm run deploy` (requires auth)

## 📂 Documentation Index
- **Rules**: `ai/rules/` (Code Quality, Testing, Patterns)
- **Setup**: `docs/EMULATOR_SETUP.md`, `scripts/setup.sh`
- **Testing Guide**: `docs/TESTING_GUIDE.md`

## 🔄 CI/CD Workflow
The master pipeline is `.github/workflows/deploy.yml`.
1. **Test Job**: Runs `npm run verify -- --skip-build` (Lint, All Tests, Storybook).
2. **Build Job**: Runs `npm run build` with secrets.
3. **Deploy Job**: Deploys to Firebase (on main).
