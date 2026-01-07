# Plan - Cookie Detection & Cropping

## Phase 1: Detection Reliability & Utilities
- [x] Task: Improve Gemini detection prompt and response parsing for better reliability. 07e7d02
- [x] Task: Implement robust error handling and fallback logic in `cookieDetectionGemini.ts`. 5720c78
- [x] Task: Write unit tests for detection utility functions (coordinate transformation, scaling). 58a0a69
- [ ] Task: Conductor - User Manual Verification 'Detection Reliability' (Protocol in workflow.md)

## Phase 2: Manual Experience & UI Unification
- [x] Task: Implement "Butter Smooth" manual cropping interactions (drag-to-create, resize handles, delete shortcut) in `CookieCropper`. b6bea17
- [x] Task: Integrate `cookieDetectionGemini` into `CookieCropperPage` to replace or augment the legacy `blobDetection`. 9da7381
- [x] Task: Improve the mobile drawer experience for tagging and adjusting boxes in `CookieCropper`.
- [ ] Task: Conductor - User Manual Verification 'Manual Experience' (Protocol in workflow.md)

## Phase 3: Integration & Live Updates
- [x] Task: Refactor `useImageStore` to use Firestore real-time listeners (`onSnapshot`) for `fetchCroppedCookiesForCategory` to enable live updates. 676905d
- [x] Task: Optimize the `CroppedCookieTaggingGrid` for performance when handling 20+ cookie cutouts. f154ca5
- [ ] Task: Verify that baker assignments and crop coordinates are correctly persisted in Firestore.
- [ ] Task: Conduct a full end-to-end audit of the admin flow from image upload to final tagging.
- [ ] Task: Conductor - User Manual Verification 'Integration & Tagging' (Protocol in workflow.md)
