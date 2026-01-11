# Implementation Plan - Enhance Cookie Cropper UI & Layout

## User Objective
Enhance the Cookie Cropper UI to:
1.  Make the page **never scroll vertically**.
2.  Remove excess padding to maximize space for the image.
3.  Refactor `FloatingPalette` to be a controlled component (sidebar).

## Tasks

### 1. Refactor `FloatingPalette.tsx`
- [x] **Goal**: Convert to a controlled component.
- [x] **Changes**:
    - Remove internal `isMinimized` state and drag logic.
    - Accept `isOpen` and `onToggle` props.
    - Style as a fixed sidebar (glassmorphism) that slides in/out or toggles visibility.
    - Ensure it doesn't cause page scrolling.

### 2. Update `CookieCropperPage.tsx` Layout
- [x] **Goal**: Implement Full Page "No Scroll" layout.
- [x] **Changes**:
    - Ensure root container takes `100vh`.
    - Content area should be `flex-grow` with `overflow: hidden`.
    - Image container should fit within the available space without forcing generic page scroll.
    - Pass `isOpen` and `onToggle` to `FloatingPalette`.
    - Adjust margins/padding dynamically based on `isOpen`.

### 3. CSS Optimization (`CookieCropperPage.module.css`)
- [x] **Goal**: Remove excess padding and enforce `overflow: hidden` on main containers.
- [x] **Changes**:
    - `containerFullPage`: `h-screen`, `w-screen`, `overflow-hidden`.
    - `mainContent`: Remove unnecessary padding.
    - `canvasContainer`: centered, taking up max available space.

### 4. Verification
- [x] **Manual**: Confirmed CSS structure guarantees no scroll.
- [x] **Automated**: Run `npm run verify` (Build passed).

## Proposed Test Cases
### UI/Layout
- [ ] Page body does not scroll vertically on Desktop.
- [ ] Page body does not scroll vertically on Mobile.
- [ ] Sidebar toggles correctly and shrinks image/canvas area rather than overlaying (or overlays without pushing layout, depending on user Pref, but previous instruction said "resizing the image container").
- [ ] Grid overlay is visible.
- [ ] Category title is correct.
