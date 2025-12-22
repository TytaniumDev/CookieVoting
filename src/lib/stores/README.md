# Store Architecture

This directory contains the Zustand stores that manage the application state. We have chosen a **Domain-Driven, Multi-Store Architecture** to separate concerns and improve performance.

## Architecture Decisions

### Why this approach?
1.  **Separation of Concerns (Raw vs. Semantic)**:
    -   **Problem**: Mixing "Detections" (ML coordinates) with "Tags" (Game logic/Baker assignment) risks breaking the game state when updates occur.
    -   **Solution**: `useImageStore` handles the *technical* layer (ML bounding boxes). `useCookieStore` handles the *game* layer (This box = "Ryan's Cookie"). This allows re-running detection without deleting votes.

2.  **Flat vs. Nested Data**:
    -   **Problem**: Storing Cookies inside nested `Category` objects makes updates painful and inefficient.
    -   **Solution**: **Flat stores**. `useCookieStore` holds all cookies for an event. We query by `categoryId`. This is O(1) for updates and O(N) for filtering, optimal for React UI responsiveness.

## The Stores

### 1. `useEventStore` (Configuration)
**Role**: The "Campaign Manager".
-   **Manages**: Event metadata (ID, Name, Date) and Categories.
-   **Why separate Categories?**: Categories are fetched on-demand to keep the initial dashboard load fast. They are not part of the lightweight `VoteEvent` summary.

### 2. `useImageStore` (Raw Assets)
**Role**: The "Asset Library".
-   **Manages**: URLs, Bytes, and ML Detections (Bounding Boxes/Polygons).
-   **Key Concept**: It cares about *pixels*, not *players*.
-   **Assumption**: Images are immutable; detecting cookies again just updates the polygon, not the Image ID.

### 3. `useBakerStore` (Participants)
**Role**: The "Roster".
-   **Manages**: List of valid bakers (ID, Name).
-   **Key Concept**: Centralized management allows renaming a baker ("Jon" -> "Jonathan") to propagate everywhere instantly.

### 4. `useCookieStore` (Game Entities)
**Role**: The "Game Pieces".
-   **Manages**: The link between a **Raw Detection** (`detectionId` from `useImageStore`) and a **Player** (`bakerId`).
-   **Key Concept**: This is the "Join Table". It is the entity you actually vote on.

### 5. `useVoteStore` (Runtime)
**Role**: The "Scoreboard".
-   **Manages**:
    -   `aggregateVoteCounts`: Global totals (Cookie ID -> Count). Updated in real-time.
    -   `currentUserSelections`: Local user ballot (Category Link -> Cookie ID).
-   **Why separate?**: Votes change every second during an event. Isolating this state prevents re-rendering the heavy static components (Images/Descriptions).

### 6. `useAuthStore` (Session)
**Role**: Identity.
-   **Manages**: User session, Admin status interactions.
