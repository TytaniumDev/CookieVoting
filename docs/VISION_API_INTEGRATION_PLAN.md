# Vision API Integration with Voting System

## Overview

Integrate the Vision API pipeline (`cookie_batches`) with the existing voting system. Replace coordinate-based cookie tracking with individual cookie images. Update voting to use cookie IDs instead of numbers, add processing status management, and create a grid-based voting UI to replace CookieViewer.

## Architecture Changes

### Data Model Updates

**File**: [`src/lib/types.ts`](src/lib/types.ts)

Replace `CookieCoordinate` with a simplified `Cookie` interface:

```typescript
export interface Cookie {
  id: string; // Unique ID (used for voting)
  imageUrl: string; // Public URL to the individual cropped cookie image
  bakerId?: string; // Optional baker ID reference (bakers stored as subcollection)
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string; // Keep for reprocessing capability
  cookies: Cookie[]; // Array of individual cookie images
  order?: number;
  batchId?: string; // Links to cookie_batches/{batchId} if processed via Vision API
}
```

**Key Changes:**

- Remove `CookieCoordinate` interface
- Remove `CookieCandidate` interface - use unified `Cookie` model everywhere
- Remove coordinate tracking (x, y) - not needed for individual images
- Remove `number` field - ordering handled by array position
- `bakerId` is optional (cookies can exist without baker assignment)
- `Category.imageUrl` kept for reprocessing capability
- **Single model**: Cloud Function writes `Cookie` objects directly to `Category.cookies` array - no frontend conversion needed

### Vote Structure Update

**File**: [`src/lib/types.ts`](src/lib/types.ts)

Update `UserVote` to use cookie IDs with forward-compatibility for ranked choice voting:

```typescript
export interface UserVote {
  userId: string;
  votes: Record<string, string[]>; // categoryId -> cookieId[] (array for ranked choice compatibility)
  timestamp: number;
  viewedResults?: boolean;
}
```

**Key Changes:**

- Changed from `Record<string, string>` to `Record<string, string[]>`
- For single-vote (current behavior): array contains one element `[cookieId]`
- For ranked choice (future): array contains multiple elements `[cookieId1, cookieId2, ...]` in preference order
- Forward-compatible: no breaking changes needed when implementing ranked choice voting later

## Implementation Plan

### 1. Update Type Definitions

**File**: [`src/lib/types.ts`](src/lib/types.ts)

- Replace `CookieCoordinate` interface with `Cookie` interface
- Update `Category` interface to use `Cookie[]` and add `batchId?`
- Update `UserVote` to use `Record<string, string[]>` for votes (forward-compatible with ranked choice)
- Remove `DetectedCookie` if no longer needed (or keep if used elsewhere)

### 2. Update Cloud Function

**File**: [`functions/src/index.ts`](functions/src/index.ts)

Update `processCookieImage` Cloud Function to:

- Read `eventId` and `categoryId` from batch document
- Generate public download URLs for each cropped cookie image
- Write `Cookie[]` objects directly to `Category.cookies` array when processing completes
- Use `Cookie` interface: `{ id: string, imageUrl: string, bakerId?: string }`

**Key Changes:**

- Batch document stores `eventId` and `categoryId` (added in uploadTray)
- Cloud Function generates public URLs using `storage.file(storagePath).publicUrl()` or `getDownloadURL()`
- Cloud Function writes cookies directly to `events/{eventId}/categories/{categoryId}.cookies` array field
- No intermediate `CookieCandidate` model - just `Cookie` from start to finish

### 3. Update uploadTray Function

**File**: [`src/lib/uploadTray.ts`](src/lib/uploadTray.ts)

Update `uploadTray` to accept and store `eventId` and `categoryId`:

```typescript
export async function uploadTray(
  file: File,
  batchId: string,
  eventId: string,
  categoryId: string,
  options?: UploadTrayOptions,
): Promise<string> {
  // ... existing validation ...

  await setDoc(batchRef, {
    status: 'uploading',
    paddingPercentage,
    eventId,
    categoryId,
    createdAt: serverTimestamp(),
    originalImageRef: `uploads/${batchId}/original.jpg`,
  });

  // ... rest of function ...
}
```

### 4. Update Firestore Functions

**File**: [`src/lib/firestore.ts`](src/lib/firestore.ts)

- Update `updateCategoryCookies` signature: `(eventId, categoryId, cookies: Cookie[])`
  - This function writes the Cookie[] array directly to the Category document in Firestore
  - Used for: updating baker assignments, reprocessing cleanup, etc.
  - All Cookie data persists in Firebase - no client-side-only state
- Update `addCategory` to accept optional `batchId` parameter
- Update `updateCategory` to allow setting `batchId`
- Add function: `clearCategoryCookies(eventId, categoryId): Promise<void>` (for reprocessing cleanup)
- Note: No `linkBatchToCategory` needed - Cloud Function writes directly to Category.cookies array in Firestore
- Update `submitVote` to accept `Record<string, string[]>` (categoryId -> cookieId[])
- Update `getUserVote` return type
- For single-vote behavior: store as array with one element `[cookieId]`
- When reading votes: use `votes[categoryId][0]` for single vote (or full array for ranked choice in future)

### 5. Add Processing Status Management (Frontend)

**File**: [`src/lib/firestore.ts`](src/lib/firestore.ts)

Add helper to determine processing status from batch:

```typescript
export type ProcessingStatus = 'not_processed' | 'in_progress' | 'processed' | 'error';

export async function getCategoryProcessingStatus(
  eventId: string,
  categoryId: string,
): Promise<ProcessingStatus> {
  const category = await getCategory(eventId, categoryId);
  if (!category?.batchId) return 'not_processed';

  const batchDoc = await getDoc(doc(db, 'cookie_batches', category.batchId));
  if (!batchDoc.exists()) return 'not_processed';

  const batch = batchDoc.data() as CookieBatch;
  if (batch.status === 'ready') return 'processed';
  if (batch.status === 'error') return 'error';
  return 'in_progress';
}
```

Add function for reprocessing (cleans up cookies and batch):

```typescript
export async function reprocessCategory(eventId: string, categoryId: string): Promise<void> {
  const category = await getCategory(eventId, categoryId);
  if (!category) throw new Error('Category not found');

  // Clear cookies
  await clearCategoryCookies(eventId, categoryId);

  // Delete batch document if exists
  if (category.batchId) {
    await deleteDoc(doc(db, 'cookie_batches', category.batchId));
    // Note: Storage files cleanup handled separately if needed
  }

  // Clear batchId from category
  await updateDoc(doc(db, 'events', eventId, 'categories', categoryId), {
    batchId: null,
  });
}
```

### 6. Integrate Vision API Upload with Category Creation

**File**: [`src/components/organisms/admin/CategoryManager/CategoryManager.tsx`](src/components/organisms/admin/CategoryManager/CategoryManager.tsx)

Add Vision API processing option:

- Add checkbox/toggle: "Process with Vision API" (default: true for automatic processing)
- When creating category with Vision API enabled:
  - Upload image to category (store imageUrl)
  - Generate batchId (UUID)
  - Upload to Vision API pipeline using `uploadTray` with batchId, eventId, categoryId
  - Link batchId to category immediately (Cloud Function will write cookies directly)
- Add processing status indicator to each CategoryCard
- Add "Process" button for categories not yet processed
- Add "Reprocess" button with confirmation dialog

### 7. Create Batch Monitoring Hook

**New File**: [`src/lib/hooks/useCategoryProcessing.ts`](src/lib/hooks/useCategoryProcessing.ts)

Hook to monitor batch status (simplified - no conversion needed, Cloud Function handles it):

```typescript
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { ProcessingStatus } from '../firestore';

export function useCategoryProcessing(batchId: string | null): ProcessingStatus {
  const [status, setStatus] = useState<ProcessingStatus>('not_processed');

  useEffect(() => {
    if (!batchId) {
      setStatus('not_processed');
      return;
    }

    const batchRef = doc(db, 'cookie_batches', batchId);
    const unsubscribe = onSnapshot(batchRef, (snapshot) => {
      if (!snapshot.exists()) {
        setStatus('not_processed');
        return;
      }

      const batch = snapshot.data();
      if (batch.status === 'ready') setStatus('processed');
      else if (batch.status === 'error') setStatus('error');
      else setStatus('in_progress');
    });

    return unsubscribe;
  }, [batchId]);

  return status;
}
```

### 8. Update CategoryCard Component

**File**: [`src/components/molecules/CategoryCard/CategoryCard.tsx`](src/components/molecules/CategoryCard/CategoryCard.tsx)

Add processing status indicator:

- Add `processingStatus?: ProcessingStatus` prop
- Display status badge: "Not Processed", "Processing...", "Processed", "Error"
- Add `onProcess?: () => void` prop for "Process" button
- Add `onReprocess?: () => void` prop for "Reprocess" button (with confirmation)

### 9. Create Grid-Based Voting Component

**New File**: [`src/components/organisms/voting/CookieGrid/CookieGrid.tsx`](src/components/organisms/voting/CookieGrid/CookieGrid.tsx)

Replace CookieViewer with grid layout:

```typescript
interface CookieGridProps {
  cookies: Cookie[];
  selectedCookieId?: string;
  onSelectCookie: (cookieId: string) => void;
  className?: string;
}

export function CookieGrid({
  cookies,
  selectedCookieId,
  onSelectCookie,
  className,
}: CookieGridProps) {
  // Display cookies in responsive grid
  // Show selection state
  // Handle click to select
}
```

### 10. Update VotingSessionView

**File**: [`src/components/organisms/voting/VotingSessionView.tsx`](src/components/organisms/voting/VotingSessionView.tsx)

- Replace `CookieViewer` usage with `CookieGrid`
- Update vote handler: `onVote(categoryId: string, cookieId: string)` (instead of cookieNumber)
- Update props: `votes: Record<string, string[]>` (categoryId -> cookieId[])
- For single vote: store as `[cookieId]`, read as `votes[categoryId]?.[0]`
- Remove coordinate/detection mapping logic

### 11. Update VotingResultsView

**File**: [`src/components/organisms/voting/VotingResultsView.tsx`](src/components/organisms/voting/VotingResultsView.tsx)

- Replace `CookieViewer` usage with `CookieGrid`
- Update results calculation to use cookie IDs
- Display cookies with vote counts and rankings in grid
- Remove coordinate/detection mapping logic

### 12. Update Results Data Hook

**File**: [`src/lib/hooks/useResultsData.ts`](src/lib/hooks/useResultsData.ts)

- Update `CookieScore` interface to use `Cookie` instead of `CookieCoordinate`
- Update `calculateResults` to work with cookie IDs
- Change vote tallying from `cookieNumber` to `cookieId`
- Remove `DetectedCookie` dependencies

**Updated Interface:**

```typescript
export interface CookieScore {
  cookieId: string;
  cookie: Cookie;
  votes: number;
  // bakerId comes from cookie.bakerId (reference by ID for future extensibility)
}
```

### 13. Remove CookieViewer Component

**File**: [`src/components/organisms/CookieViewer/CookieViewer.tsx`](src/components/organisms/CookieViewer/CookieViewer.tsx)

- Delete the file (or mark as deprecated if used elsewhere)
- Remove from exports in [`src/components/organisms/index.ts`](src/components/organisms/index.ts)

### 14. Update Category Upload Flow

**File**: [`src/components/organisms/admin/CategoryManager/CategoryManager.tsx`](src/components/organisms/admin/CategoryManager/CategoryManager.tsx)

Update `onSubmit` to support Vision API processing:

- Add state for "Process with Vision API" toggle
- When enabled: upload to Vision API pipeline, create batch, link to category
- When disabled: use current flow (just store imageUrl)

### 15. Update Navigation

**File**: [`src/pages/admin/AdminCategories.tsx`](src/pages/admin/AdminCategories.tsx)

- Remove `handleCategoryClick` (no longer navigates to cropper)
- Category cards now show processing status and actions inline

## Data Flow

### Processing Flow

1. **Category Creation**:
   - Admin creates category with tray image
   - Option to "Process with Vision API" (default: true)
   - If enabled: upload to `uploads/{batchId}/original.jpg`, create `cookie_batches/{batchId}`, link `batchId` to category

2. **Vision API Processing**:
   - Cloud Function processes image → crops cookies, generates public URLs
   - Cloud Function writes `Cookie[]` directly to `Category.cookies` array in Firestore
   - Batch status: "uploading" → "processing" → "ready"
   - No intermediate storage - cookies go directly into Category.cookies array in Firestore

3. **Cloud Function Processing**:
   - Cloud Function processes image → crops cookies, generates public URLs
   - Cloud Function writes `Cookie[]` directly to `Category.cookies` array in Firestore
   - Batch status: "uploading" → "processing" → "ready"
   - No intermediate storage - cookies go directly into Category.cookies array in Firestore

4. **Baker Assignment** (Future):
   - Admin UI to assign bakers to cookies (updates `Cookie.bakerId`)
   - Changes saved immediately to Firestore via `updateCategoryCookies`
   - Can be done before or after voting starts

### Voting Flow

1. **Vote Selection**:
   - User views category with grid of cookie images
   - Clicks on cookie image to select
   - Vote stored as `categoryId -> [cookieId]` (array with single element for now, expandable to ranked choice)

2. **Results Calculation**:
   - Tally votes by `cookieId` (for single vote: use `votes[categoryId]?.[0]`)
   - Display cookies in grid with vote counts and rankings
   - Future ranked choice: use full array for ranked choice voting algorithms

## Data Storage

All Cookie data is stored in Firebase Firestore:

- `Category.cookies: Cookie[]` - Array field in the Category document, stored in Firestore
- Cookies are automatically saved to the cloud when written by the Cloud Function
- Frontend reads directly from Firestore - no client-side-only state
- Baker assignments (updating `Cookie.bakerId`) should be saved immediately to Firestore using `updateCategoryCookies`

**Note**: Existing test databases should be deleted - no migration needed.

## Files to Create

1. `src/lib/hooks/useCategoryProcessing.ts` - Processing status monitoring hook
2. `src/components/organisms/voting/CookieGrid/CookieGrid.tsx` - Grid voting component

## Files to Modify

1. `src/lib/types.ts` - Update interfaces (remove CookieCandidate, use Cookie only)
2. `functions/src/index.ts` - Update Cloud Function to write Cookie[] directly to Category
3. `src/lib/uploadTray.ts` - Update to accept eventId and categoryId
4. `src/lib/firestore.ts` - Update functions, add processing helpers
5. `src/lib/hooks/useResultsData.ts` - Update for cookie IDs
6. `src/components/organisms/admin/CategoryManager/CategoryManager.tsx` - Add processing UI
7. `src/components/molecules/CategoryCard/CategoryCard.tsx` - Add status indicator
8. `src/components/organisms/voting/VotingSessionView.tsx` - Replace CookieViewer
9. `src/components/organisms/voting/VotingResultsView.tsx` - Replace CookieViewer
10. `src/pages/admin/AdminCategories.tsx` - Update navigation

## Files to Delete

1. `src/components/organisms/CookieViewer/CookieViewer.tsx` - No longer needed

## Testing Considerations

- Test Cloud Function writing cookies directly to Category.cookies array
- Test processing status updates in real-time
- Test reprocessing cleanup (cookies, batch document)
- Test voting with cookie IDs
- Test results calculation with new structure
- Test backward compatibility for existing data (if supported)
