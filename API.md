# API Reference: CookieVoting

This document outlines the core data models and server-side functions used in the CookieVoting application.

## 1. Firestore Schema

The application uses Cloud Firestore as its primary NoSQL database.

### `events/{eventId}`

Stores the configuration and metadata for a voting event.

- **id**: `string` (unique event identifier)
- **name**: `string` (Event display name)
- **adminCode**: `string` (Secret code for joining as an admin)
- **status**: `enum` ('voting', 'completed')
- **resultsAvailableTime**: `timestamp` (When results become visible to voters)

### `events/{eventId}/categories/{categoryId}`

Represents a "Plate" or grouping of cookies within an event.

- **id**: `string` (unique category identifier)
- **name**: `string` (Category name)
- **imageUrl**: `string` (URL to the full tray image)
- **cookies**: `array` of objects
  - **id**: `string` (unique cookie identifier)
  - **number**: `number` (sequential index within the category)
  - **makerName**: `string` (optional baker name)
  - **imageUrl**: `string` (URL to cropped cookie image)

### `events/{eventId}/votes/{voteId}`

Stores individual user votes. This collection is write-heavy and publicly accessible (anonymous auth).

- **userId**: `string` (Firebase Auth UID)
- **votes**: `map` (categoryId -> cookieNumber)
- **timestamp**: `timestamp` (When the vote was cast)

### `cookie_batches/{batchId}`

Tracks the state of the automated cookie detection pipeline. Not directly exposed to voters.

- **status**: `enum` ('uploading', 'processing', 'review_required', 'ready', 'error')
- **originalImageRef**: `string` (Storage path: `uploads/{batchId}/original.jpg`)
- **detectedObjects**: `array` of objects (Google Cloud Vision API output)
  - **normalizedVertices**: `array` of {x, y} coordinates (0-1 range)
  - **confidence**: `number` (0-1 score)
- **paddingPercentage**: `number` (Default: 0.1)

---

## 2. Cloud Functions

These functions are deployed to Firebase Functions (`functions/src/index.ts`).

### Storage Triggers

#### `processCookieImage`
- **Trigger**: `google.storage.object.finalize`
- **Path**: `uploads/{batchId}/original.jpg`
- **Description**:
  1. Detects upload of a new tray image.
  2. Calls **Google Cloud Vision API** (Object Localization).
  3. Updates `cookie_batches/{batchId}` with `detectedObjects`.
  4. Sets status to `review_required`.

### Callable Functions (HTTPS)

#### `confirmCookieCrops`
- **Auth Required**: Yes (`admin: true`)
- **Input**: `{ batchId: string, crops: Array<{ x, y, width, height }> }`
- **Description**:
  1. Admins confirm the final crop coordinates.
  2. Uses `sharp` to physically crop the high-res original image.
  3. Uploads cropped images to `processed_cookies/{batchId}/{cookieId}.jpg`.
  4. Updates the target `Category` with new cookie entries.
  5. Sets batch status to `ready`.

#### `addAdminRole`
- **Auth Required**: Yes (`admin: true`)
- **Input**: `{ email: string }`
- **Description**: Grants the `admin` custom claim to a user by email.

#### `removeAdminRole`
- **Auth Required**: Yes (`admin: true`)
- **Input**: `{ email: string }` OR `{ uid: string }`
- **Description**: Revokes the `admin` custom claim.

---

## 3. Storage Structure

- **`uploads/{batchId}/original.jpg`**: Raw, high-res images uploaded by admins. Triggers detection.
- **`processed_cookies/{batchId}/{cookieId}.jpg`**: Final, cropped cookie images used in the voting UI.
- **`shared/cookies/`**: Reusable cookie images.
