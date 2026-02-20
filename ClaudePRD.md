# Product Requirements Document (PRD): CookieVoting

## 1. Introduction

**CookieVoting** is a web application for running cookie competitions. Admins create events, upload photos of cookie plates, run AI-based cookie detection, assign bakers to detected cookies, and control voting status. Voters join via a shared URL, rank their favourite cookies per category, and can view live results once the admin opens them.

The voting experience should be fun, festive, mobile-first, and responsive on desktop. The admin experience should be linear, guided, and low-friction.

---

## 2. Goals & Objectives

- **Streamline Competition Management**: Guided admin flow from event creation to results.
- **Accurate Cookie Identification**: AI detects individual cookies from plate photos, with admin correction tools.
- **Fair & Fun Voting**: Simple, ordered ranked-choice voting using Borda Count scoring.
- **Live Results**: Real-time aggregation and display of results as votes come in.

---

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend Framework | Next.js (React + TypeScript) | App Router |
| Hosting | Vercel | Free tier, zero-config deploys from GitHub |
| Database | Firebase Firestore | Real-time listeners, NoSQL |
| Auth | Firebase Auth | Google Sign-In (admins) + Anonymous Auth (voters) |
| File Storage | Firebase Storage | Plate images + cropped cookie images |
| AI Detection | Gemini Vision API (`gemini-2.0-flash` or latest equivalent) | Prompted to return bounding boxes/polygons |
| Cloud Functions | Firebase Cloud Functions | Server-side image cropping and Gemini API calls to avoid Vercel timeouts |
| Styling | Tailwind CSS | |
| Testing | Playwright | End-to-end and component testing |
| UI Explorer | Storybook | Deployed automatically to GitHub Pages |

All services should be used within their free tiers where possible.

---

## 4. User Roles

### 4.1 Admin
- Authenticated via Google Sign-In through Firebase Auth.
- Allowlisted by email address in Firestore (a `admins` collection containing allowed email addresses). Only emails on the allowlist are granted admin access after signing in.
- Can create and manage events, upload images, run detection, correct detections, assign bakers, manage the baker roster, and control event status.

### 4.2 Voter
- Joins via a shared event URL: `[domain]/event/[eventId]`
- Authenticated via Firebase Anonymous Auth. The anonymous User ID is used to enforce one submission per event per browser session.
- If a voter clears their browser or uses a different device, they can vote again. This is acceptable behaviour.
- Does not need to create an account or log in.

---

## 5. Data Models

### `admins` (collection)
```
{
  email: string
}
```
Document ID is the email address itself.

### `bakers` (collection) — Global
```
{
  id: string,         // Firestore auto ID
  name: string
}
```
Persists across events. This is the global baker roster.

### `events` (collection)
```
{
  id: string,         // Firestore auto ID
  name: string,
  status: "setup" | "voting" | "results",
  createdAt: timestamp,
  bakerIds: string[]  // Subset of global bakers assigned to this event
}
```

### `events/{eventId}/categories` (subcollection)
```
{
  id: string,
  name: string,
  order: number,      // For manual reordering
  plateImageUrl: string,      // Original uploaded plate image
  detectionStatus: "pending" | "running" | "complete" | "error",
  cookies: Cookie[]   // Array embedded in the category document
}
```

### `Cookie` (embedded in Category)
```
{
  id: string,         // UUID generated at detection time
  croppedImageUrl: string,
  boundingBox: { x: number, y: number, width: number, height: number },  // Normalised 0–1
  polygon: { x: number, y: number }[] | null,
  bakerId: string | null
}
```

### `events/{eventId}/userVotes` (subcollection)
```
{
  id: string,         // Firebase Anonymous User ID
  submittedAt: timestamp,
  votes: {
    [categoryId: string]: string[] // Array of ranked cookieIds: [firstChoiceId, secondChoiceId, thirdChoiceId]
  }
}
```

---

## 6. Admin Flow (Linear, Guided)

The admin flow is strictly linear. Each step must be completed before proceeding to the next. A stepper/progress indicator in the UI reflects the current stage.

```
Create Event
    ↓
Manage Bakers (for this event)
    ↓
Add Categories (one or more; upload plate images)
    ↓
Run Detection & Correct Results (per category)
    ↓
Assign Bakers (per category)
    ↓
Open Voting
    ↓
Open Results
```

### Step 1: Create Event
- Admin enters an event name.
- A new event document is created in Firestore with `status: "setup"`.

### Step 2: Manage Event Bakers
- Admin sees a list of all bakers currently assigned to this event (initially empty).
- Admin can search/browse the global `bakers` collection and add bakers to the event's `bakerIds` array.
- Admin can also create a new baker here; new bakers are saved to the global `bakers` collection and immediately added to the event.
- Admin can remove bakers from the event (does not delete from global list).
- Admin can also skip this step and return to it later (before the Assign Bakers step, baker assignment must be complete).

### Step 3: Add Categories
- Admin enters a category name. The name input auto-suggests from category names used in previous events, ranked by frequency of use.
- Admin uploads a plate image. Accepted formats: JPEG, PNG. No strict size limit, but images are compressed on upload if over 5 MB.
- The original plate image is stored in Firebase Storage.
- Multiple categories can be added. Categories can be reordered via drag-and-drop (updates the `order` field).
- A category can be deleted if no votes have been cast yet.

### Step 4: Run Detection & Correct (per category)
- Each category has a **"Run Detection"** button. Detection does not run automatically on upload.
- When detection runs:
  1. A Firebase Cloud Function is triggered. The plate image is sent to the Gemini Vision API with a prompt asking it to identify individual cookies. The prompt must enforce `response_mime_type: "application/json"` and return an array of normalized bounding boxes (e.g., `[ymin, xmin, ymax, xmax]`).
  2. The Firebase Cloud Function processes the bounding boxes, crops each detected cookie from the original image, and saves the cropped images to Firebase Storage. This offloads the intensive cropping from the client/Vercel to a dedicated backend.
  3. The `cookies` array in the category document is populated with detected cookies and their `croppedImageUrl` and `boundingBox`/`polygon`.
  4. `detectionStatus` is set to `"complete"` on success or `"error"` on failure.
- **Correction UI**:
  - Admin sees the original plate image with bounding boxes/polygons overlaid.
  - Admin can **delete** a false detection (removes it from the `cookies` array).
  - Admin can **add** a new cookie by drag-selecting a rectangular region on the plate image; this creates a new cookie entry with a cropped image.
  - Admin can **merge** two cookies by selecting both and confirming; the merged result uses the bounding union of both and regenerates the crop.
  - No drawing of arbitrary polygons is required; rectangles are sufficient for all correction operations.

### Step 5: Assign Bakers (per category)
- For each category, admin sees all detected cookie crops.
- Each cookie has a baker assignment dropdown populated with the bakers on the event's baker list.
- The dropdown supports type-to-filter.
- Baker assignment is **mandatory** for all cookies before the event can move to voting. The UI should prevent advancing if any cookie is unassigned.
- One baker can be assigned to multiple cookies in the same category, but the default UX assumes one baker per cookie (e.g. the previously assigned baker is not pre-selected to nudge the admin to make an explicit choice).

### Step 6: Open Voting
- Admin clicks "Open Voting" on the dashboard.
- Event `status` changes to `"voting"`.
- Admin sees the shareable event URL: `[domain]/event/[eventId]`
- The dashboard shows a live count of total vote submissions for this event.

### Step 7: Open Results
- Admin clicks "Open Results" on the dashboard.
- Event `status` changes to `"results"`.
- Voting can still continue after this point; results update in real time.

---

## 7. Voter Flow (Wizard)

Voters access the app at `[domain]/event/[eventId]`. Firebase Anonymous Auth is initialised on page load; the anonymous User ID is used to track submission.

### Step 1: Landing
- Displays the event name.
- Shows a list of all category names in order.
- A single "Start Voting" button advances to the voting session.
- If the voter has already submitted for this event (User ID found in `userVotes`), they are directed to the Waiting or Results screen depending on event status.

### Step 2: Voting Session
- One category is shown at a time. The voter navigates between categories using forward/back buttons (or swipe on mobile). A progress indicator shows which category they are on (e.g. "Category 2 of 5").
- Within each category, cookies are displayed in a scrollable grid of cropped images. The layout should aim to fit all cookies on screen without scrolling where possible (grid density adapts to cookie count).
- Each cookie card has a small magnifying glass 🔍 icon in the corner. Tapping this icon enlarges the image in a modal for inspection.
- Voters tap the cookie card itself to select their top 3 (1st, 2nd, 3rd) in order. Each selected cookie is visually labelled with its rank (e.g. a badge showing "1", "2", "3").
- Tapping an already-ranked cookie deselects it. The remaining selections auto-renumber intuitively (e.g., if the 2nd choice is deselected, the 3rd choice shifts up to become the new 2nd choice).
- If a category has fewer than 3 cookies, the maximum selections adjusts to the number of cookies available.
- Votes are stored locally (React state) until final submission. Navigating between categories does not lose selections.
- A voter can go back and change their selections for any category before submitting.

### Step 3: Submission
- A review screen shows the voter's selections across all categories before final submission.
- On "Submit", the full vote object is written to `events/{eventId}/userVotes/{userId}`.
- If a document already exists for this User ID, submission is rejected (enforced by Firestore security rules).

### Step 4: Waiting
- If event `status` is `"voting"` after submission, voter sees a waiting screen indicating results aren't available yet.
- The screen uses a Firestore real-time listener on the event document. When `status` changes to `"results"`, the voter is automatically navigated to the Results screen.

### Step 5: Results
- Voter sees the results screen (same as the public results view described in Section 9).

---

## 8. Scoring

Scoring uses the **Borda Count** method.

For each category, each voter selects up to 3 cookies in ranked order. Points awarded per voter per category:
- 1st choice: **3 points**
- 2nd choice: **2 points**
- 3rd choice: **1 point**

A cookie's total Borda score for a category is the sum of all points it received from all voters.

For the **overall baker score**, each baker's Borda points are summed across all categories they appear in. If a baker does not appear in a category, they receive 0 points for that category.

---

## 9. Results Page

Accessible at `[domain]/event/[eventId]` when event `status` is `"results"`. Also accessible to voters who have already submitted.

The page uses Firestore real-time listeners and updates live as new votes come in.

### Per-Category Rankings
- All categories are shown.
- Within each category, all cookies are ranked by Borda score (descending).
- Each entry shows: rank, cropped cookie image, baker name, Borda score.
- Ties are displayed at the same rank (e.g. two cookies tied for 2nd both show "2nd").

### Overall Baker Leaderboard
- A single leaderboard shows all bakers ranked by their total Borda score across all categories.
- Each entry shows: rank, baker name, total score.
- Ties are shown at the same rank.

---

## 10. Admin Dashboard

The dashboard is the central hub after login. It shows:
- A list of all events (name, status, created date).
- Ability to navigate into any event to manage it.
- The current step in the admin flow for each in-progress event.

While an event is in `"voting"` or `"results"` status:
- Shows the live count of total vote submissions.
- Shows the shareable voter URL.
- Shows buttons to advance event status ("Open Results").

---

## 11. URL Structure

| Route | Description |
|---|---|
| `/` | Admin login / dashboard |
| `/admin/events/new` | Create event |
| `/admin/events/[eventId]` | Event management (stepper) |
| `/event/[eventId]` | Voter-facing landing + voting flow |
| `/event/[eventId]/results` | Public results page |

---

## 12. Security Rules (Firestore)

- **`admins` collection**: Read-only by authenticated users (to check allowlist). Write only by existing admins.
- **`bakers` collection**: Read/write by admins only.
- **`events` collection and subcollections**: Read by anyone (for voter flow). Write/update by admins only, except:
  - `events/{eventId}/userVotes/{userId}`: A user may **create** a document only if `request.auth.uid == userId` and no document already exists. No updates or deletes allowed.

---

## 13. Testing & Component Strategy

- **Component-Driven Development**: The web application must be built using small, isolated, and reusable UI components.
- **Storybook**: All UI components must be visualised and documented using Storybook. A CI/CD pipeline should deploy the Storybook instance to GitHub Pages.
- **Playwright Testing**: Playwright will be used for both end-to-end (E2E) testing of critical user flows (admin creating an event, voter submitting a vote) and visual/functional testing of individual components.

---

## 14. Non-Functional Requirements

- **Design Aesthetics & Theming**: The application must feature a fun, festive, Christmas theme. The design should utilize appropriate colours (reds, greens, golds), subtle snow animations, and festive emojis or imagery where appropriate. The design system must be built for easy iteration, meaning colors and core styles must be defined globally (e.g., as CSS variables or centralized Tailwind theme variables) so they can be easily swapped out across the entire application without needing to update individual component files.
- **Mobile-first**: All voter-facing screens must be fully usable on a 375px wide screen. Admin screens should be responsive but may be optimised for desktop.
- **Free tier**: The application must remain within the free tiers of Vercel, Firebase (Spark plan), and Gemini API usage under normal event loads (assumed: <200 voters per event, <20 categories, <50 cookies per category).
- **Infrequent use**: No expectation of continuous traffic. Firebase Firestore listeners should be properly unsubscribed to avoid unnecessary reads.
- **Image handling**: Plate images larger than 5 MB should be compressed client-side before upload. Cropped cookie images should be stored as JPEG at reasonable quality (e.g. 85%).
