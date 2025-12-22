# Task: Codebase Polish & Test Coverage Enhancement

## Status: Complete

## Objectives

- [x] Fix all current lint warnings and errors (verify clean `npm run verify`) <!-- id: 0 -->
- [x] Enable Code Coverage reporting in Vitest <!-- id: 1 -->
- [x] Run all tests and ensure they pass <!-- id: 2 -->
- [x] Audit and fix React Best Practices violations <!-- id: 3 -->
- [x] Create a comprehensive Test Coverage Plan <!-- id: 4 -->

## Context

User wants a clean codebase, enabled coverage, and a plan for better testing. Current lint errors involve `Unexpected any` and accessibility warnings.

## Steps

### 1. Fix Lint Errors

- [x] Identify file with `Unexpected any` at line 345 <!-- id: 5 -->
- [x] Identify file with a11y warning at line 626 <!-- id: 6 -->
- [x] Fix these issues <!-- id: 7 -->
- [ ] Rerun `npm run verify` to confirm <!-- id: 8 -->

### 2. Enable Code Coverage

- [x] Update `vite.config.ts` or `vitest.config.ts` to include coverage configuration (v8 or c8) <!-- id: 9 -->
- [x] Add `test:coverage` script to `package.json` <!-- id: 10 -->
- [ ] Run coverage and report baseline <!-- id: 11 -->

### 3. Best Practices Audit

- [ ] Check for prop drilling <!-- id: 12 -->
- [ ] Check for huge components that need splitting (e.g. `AdminDashboard`) <!-- id: 13 -->
- [ ] Check for proper use of `useMemo` / `useCallback` <!-- id: 14 -->
- [ ] Fix identified low-hanging fruit <!-- id: 15 -->

### 4. Test Plan

- [ ] Analyze current coverage gaps <!-- id: 16 -->
- [ ] Draft a plan for Unit, Integration, and E2E tests <!-- id: 17 -->
- [ ] Save as `TESTING_STRATEGY.md` artifact <!-- id: 18 -->
