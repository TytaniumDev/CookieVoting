# Plan - Prevent Duplicate Cookie Cropping

## Problem
The `CookieCropper` page does not display previously saved cropped cookies. This leads to admins accidentally re-cropping and saving duplicates for the same image/category.

## Goal
Load and display existing cropped regions on the `CookieCropperPage` so users can see what has already been processed.

## Phase 1: Investigation & Schema Support
- [x] Task: specific Verify if `cropped_cookie` documents store their original crop coordinates (`x`, `y`, `width`, `height`).
- [x] Task: If coordinates are missing, update `ImageEntity` type and `uploadImage` logic to persist them.

## Phase 2: Implementation
- [x] Task: Update `CookieCropperPage` to accept `eventId` and `categoryId` props.
- [x] Task: Fetch existing cropped cookies for the category in `CookieCropperPage`.
- [x] Task: Convert existing cookie data back into `SliceRegion`s and merge with the cropper state.
- [x] Task: Visually distinguish "Saved" regions (e.g., green border, locked?) from "New" regions, or just load them as editable regions. (User said "shows the already detected cookies", implies preventing duplicates. Loading them as existing regions is simplest).

## Phase 3: Integration
- [x] Task: Update parent components (`EventSetupWizard`, `AdminCropper`) to pass the required IDs.
- [x] Task: Verify the flow end-to-end.
