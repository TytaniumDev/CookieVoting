# Specification - Prevent Duplicate Cookie Cropping

## Feature

Display previously saved cropped cookies as regions in the `CookieCropper` UI.

## Requirements

1.  **Persistence:** The system must store the original crop coordinates (x, y, width, height) and source image dimensions for every cropped cookie saved.
2.  **Visualization:** When opening the cropper for a specific category/image, the system must fetch all existing `cropped_cookie` records for that category.
3.  **UI Representation:**
    - Existing cookies should appear as crop boxes on the image.
    - Ideally, they should be visually distinct (e.g., "Saved") to indicate they are already in the database.
    - Admins should be able to see them to avoid overlapping/duplicating.

## Data Model Changes

- `ImageEntity`: Add `cropRegion?: { x: number, y: number, width: number, height: number }`.
- `ImageEntity`: Add `sourceImageDimensions?: { width: number, height: number }` (to handle scaling if source image size differs, though unlikely for same URL).

## UX Flow

1.  Admin opens "Crop Cookies" for "Sugar Cookies".
2.  App fetches existing "Sugar Cookie" crops.
3.  App displays the tray image.
4.  App overlays boxes for the 5 already-saved cookies.
5.  Admin draws 2 new boxes.
6.  Admin clicks "Save".
7.  App saves only the _new_ boxes (or updates if we support editing, but primary goal is preventing duplicates).
    - _Refinement:_ If we just load them as regions, the current `onSave` logic slices _all_ regions and sends them up. We need to distinguish between "new blobs to save" and "existing ones".
    - _Simplification:_ For now, just showing them is a huge help. If the user hits save, we might re-save duplicates if we aren't careful.
    - _Better Approach:_ Pass existing regions as "read-only" or "reference" visual layers that are NOT included in the `onSave` slice list. Or, allow editing but filter out unchanged ones.
    - _Decision:_ Let's render them as "Saved" regions (locked or distinct style) that are NOT part of the active `regions` state used for slicing.
