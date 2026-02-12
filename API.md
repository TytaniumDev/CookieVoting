# API Reference

This document outlines the Firestore Schema and Cloud Functions API for the Cookie Voting application.

## 🗄️ Firestore Schema

### Collection: `events`

Stores voting event details.

- `id` (string): Unique Event ID.
- `name` (string): Name of the event.
- `status` (string): `draft`, `active`, `completed`.
- `createdAt` (timestamp).
- `updatedAt` (timestamp).

#### Sub-collection: `categories`

Categories within an event (e.g., "Best Taste", "Best Presentation").

- `id` (string): Unique Category ID.
- `name` (string): Category name.
- `cookies` (array): List of cookie objects associated with this category.
  - `id` (string): Cookie ID.
  - `imageUrl` (string): URL to the cropped cookie image.
  - `title` (string): Optional title/baker name.
  - `description` (string): Optional description.

### Collection: `cookie_batches`

Temporary storage for image processing workflow.

- `id` (string): Unique Batch ID.
- `eventId` (string): Reference to the parent event.
- `categoryId` (string): Reference to the target category.
- `originalImageRef` (string): Storage path to the uploaded tray image.
- `status` (string): `processing`, `review_required`, `ready`, `error`.
- `detectedObjects` (array): List of bounding boxes from Vision API.
  - `normalizedVertices` (array): Coordinates (x, y) normalized to 0-1.
  - `confidence` (number): Confidence score.
- `paddingPercentage` (number): Padding added to crops (default: 0.1).

### Collection: `votes`

Records individual user votes.

- `userId` (string): ID of the voter.
- `eventId` (string): ID of the event.
- `categoryId` (string): ID of the category.
- `cookieId` (string): ID of the voted cookie.
- `createdAt` (timestamp).

## ⚡ Cloud Functions

All functions are deployed to `us-west1`.

### `processCookieImage`

**Trigger**: Storage (`onObjectFinalized`)
**Path**: `uploads/{batchId}/original.jpg`
**Description**:

1.  detects upload of a new tray image.
2.  Calls Google Cloud Vision API to detect objects.
3.  Updates `cookie_batches/{batchId}` with `detectedObjects` and status `review_required`.

### `confirmCookieCrops`

**Trigger**: HTTPS Callable
**Description**:
Confirm crops after admin review, crop images using Sharp, and upload individual cookies.
**Input**:

- `batchId` (string): The ID of the batch to process.
- `crops` (array): List of confirmed crop definitions `{ x, y, width, height }`.
  **Output**:
- `success` (boolean).
- `count` (number): Number of cookies created.

### `addAdminRole`

**Trigger**: HTTPS Callable (Admin Only)
**Description**: Grants admin privileges to a user by email.
**Input**:

- `email` (string): The email of the user to promote.

### `removeAdminRole`

**Trigger**: HTTPS Callable (Admin Only)
**Description**: Revokes admin privileges from a user.
**Input**:

- `email` (string): The email of the user to demote.
