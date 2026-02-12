# API & Schema Reference

This document details the backend interfaces, specifically the Firestore Data Model and Cloud Functions.

## Cloud Functions

All functions are deployed to `us-west1`.

### Triggers

#### `processCookieImage`
- **Type:** `onObjectFinalized` (Storage Trigger)
- **Trigger Path:** `uploads/{batchId}/original.jpg`
- **Description:**
  1. Validates the upload path.
  2. Enhances image contrast/normalization (Sharp).
  3. Sends image to Google Cloud Vision API (Object Localization).
  4. Updates `cookie_batches/{batchId}` with status `review_required` and `detectedObjects`.
- **Note:** Ignores non-image files or files outside the `uploads/` directory.

### Callable Functions

#### `confirmCookieCrops`
- **Type:** `onCall` (HTTPS Callable)
- **Access:** Admin only.
- **Input:**
  ```typescript
  {
    batchId: string;
    crops: Array<{
      x: number;      // 0-1 Normalized
      y: number;      // 0-1 Normalized
      width: number;  // 0-1 Normalized
      height: number; // 0-1 Normalized
    }>
  }
  ```
- **Description:**
  1. Downloads the original high-res image.
  2. Crops each specified region using `sharp`.
  3. Uploads individual cookie images to `processed_cookies/{batchId}/{cookieId}.jpg`.
  4. Updates the target Category document with the new cookie list.
  5. Updates `cookie_batches/{batchId}` status to `ready`.

#### `addAdminRole`
- **Type:** `onCall` (HTTPS Callable)
- **Access:** Admin only.
- **Input:** `{ email: string }`
- **Description:** Sets the custom claim `admin: true` on the user with the provided email.

#### `removeAdminRole`
- **Type:** `onCall` (HTTPS Callable)
- **Access:** Admin only.
- **Input:** `{ email: string }` or `{ uid: string }`
- **Description:** Sets the custom claim `admin: false`.

## Firestore Data Model

### Collection: `events`
Root collection for voting events.

- **Document ID:** `{eventId}` (UUID)
- **Fields:**
  - `name`: string
  - `adminCode`: string
  - `status`: 'voting' | 'completed'
  - `createdAt`: timestamp
  - `resultsAvailableTime`: timestamp (optional)

#### Sub-collection: `categories`
Categories (e.g., "Creative", "Taste") within an event.

- **Document ID:** `{categoryId}` (UUID)
- **Fields:**
  - `name`: string
  - `imageUrl`: string (URL of the tray image)
  - `cookies`: Array<Cookie>
    ```typescript
    interface Cookie {
      id: string;
      imageUrl: string;
      bakerId?: string;
    }
    ```
  - `batchId`: string (Reference to origin batch)

#### Sub-collection: `votes`
Individual user votes.

- **Document ID:** `{userId}` (Auth UID)
- **Fields:**
  - `selections`: Map<string, string> // categoryId -> cookieId
  - `submittedAt`: timestamp

### Collection: `cookie_batches`
Temporary processing state for the detection pipeline.

- **Document ID:** `{batchId}` (UUID)
- **Fields:**
  - `status`: 'processing' | 'review_required' | 'ready' | 'error'
  - `eventId`: string
  - `categoryId`: string
  - `originalImageRef`: string (Storage path)
  - `detectedObjects`: Array<DetectedCookie>
    ```typescript
    interface DetectedCookie {
      normalizedVertices: Array<{ x: number, y: number }>;
      confidence: number;
    }
    ```
  - `totalCandidates`: number (Final count after cropping)
  - `error`: string (optional)

### Collection: `users` (Implicit)
User profiles are generally managed via Auth, but custom claims handling uses Admin SDK.

## Storage Structure

- `uploads/{batchId}/original.jpg`: Raw high-res uploads.
- `processed_cookies/{batchId}/{cookieId}.jpg`: Final cropped assets.
