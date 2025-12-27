# Codebase Improvement Observations
This document logs observations for potential improvements discovered during implementation of the Individual Cookie Tagging feature.
---
## Observations
### 1. Firebase Logic in Components
**File:** [src/components/organisms/admin/CategoryManager/CategoryManager.tsx](file:///Users/tylerholland/Documents/Github/CookieVoting/src/components/organisms/admin/CategoryManager/CategoryManager.tsx)
**Issue:** Directly imports and uses [uploadImage](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/stores/useImageStore.ts#26-68) from [lib/storage.ts](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/storage.ts)
**Best Practice Violation:** Project guidelines state "No Firebase in UI"
**Recommendation:** Move to `useImageStore.uploadImage()` and use the store
**Priority:** Medium
**Status:** ✅ Fixed - Now uses `useImageStore.getState().uploadImage()`
---
### 2. Duplicate Image Upload Functions  
**Files:** 
- [src/lib/storage.ts](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/storage.ts) → [uploadImage(file, path)](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/stores/useImageStore.ts#26-68)
- [src/lib/stores/useImageStore.ts](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/stores/useImageStore.ts) → [uploadImage(file, eventId)](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/stores/useImageStore.ts#26-68)
**Issue:** Two separate functions with similar names but different signatures for uploading images
**Recommendation:** Consolidate into a single `useImageStore.uploadImage()` with flexible options
**Priority:** Medium
**Status:** ✅ Fixed - Removed duplicate from `storage.ts`, consolidated into `useImageStore`
---
### 3. Mixed Coordinate Systems Documentation
**Files:** [src/lib/types.ts](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/types.ts)
**Issue:** `CookieEntity.x/y`, `DetectedCookie.x/y`, and `SliceRegion.x/y` use different coordinate systems (normalized 0-100 vs pixels) without clear documentation
**Recommendation:** Add JSDoc comments clarifying coordinate system for each type
**Priority:** Low
**Status:** ✅ Fixed - Added JSDoc to `DetectedCookie` (pixels), `CookieEntity` (0-100%), `CookieCoordinate` (0-100%), and `SliceRegion` (pixels)
---
### 4. Potential Memory Leak in [useDetectionResults](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/hooks/useDetectionResults.ts#5-34)
**File:** [src/lib/hooks/useDetectionResults.ts](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/hooks/useDetectionResults.ts) line 63
**Issue:** [useCategoryDetectionCounts](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/hooks/useDetectionResults.ts#35-71) takes `categories` array as dependency but doesn't memoize the array creation
**Recommendation:** Memoize the categories array in calling components or use stable references
**Priority:** Medium (was causing infinite loops previously)
**Status:** ✅ Fixed - Added `useMemo` to create stable `categoriesKey` for dependency comparison. Added [test suite](file:///Users/tylerholland/Documents/Github/CookieVoting/src/lib/hooks/useDetectionResults.test.ts) with 9 tests to prevent regression.
---
*Last updated: 2025-12-26T23:45:00-08:00*