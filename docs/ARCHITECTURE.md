# Architecture

This is the technical design for CookieVoting. The product requirements live in
[`ClaudePRD.md`](../ClaudePRD.md). Where this document disagrees with the PRD's
_Tech Stack_ or _Data Models_ sections, this document wins; the deviations are
listed at the end with their reasons. The phased build plan is in
[`ROADMAP.md`](./ROADMAP.md).

## Guiding constraints

1. **Stay inside free tiers.** Expected cost at the PRD's load (<200 voters,
   <20 categories, <50 cookies per category) is $0.
2. **Used about once a year.** Nothing may pause, expire or need babysitting
   between events.
3. **Phones first, for everyone.** Voters _and_ admins use phones, including for
   identifying cookies on plate photos. An admin can start on a phone and carry
   on from a laptop or another admin's device, with every screen kept in sync.
4. **Scoring runs in the cloud**, not in voters' browsers.
5. **Cookie identification without paid AI.** Admins tap cookies (an in-browser
   model outlines them) or draw boxes by hand.

## Decisions

| Area                  | Choice                                                                                                    | Why                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend              | React 19 + TypeScript + Vite (SPA), React Router (data mode)                                              | The best free cookie-identification tools (MediaPipe, Transformers.js/ONNX) are JS/WASM, so a web-native stack. Small first load for voters on phones.                                                                    |
| Styling               | Tailwind CSS v4, semantic design tokens in `apps/web/src/styles/theme.css`                                | Re-skinning = editing one file (PRD §14).                                                                                                                                                                                 |
| Backend               | Firebase on the **Blaze** plan, reusing the existing `cookie-voting` project                              | Never pauses (Supabase free pauses after 7 idle days), no realtime connection cap, 5 GB photo storage free. Blaze is required for Storage and Functions. Reuse avoids redoing project setup (see [SETUP.md](./SETUP.md)). |
| Database              | Cloud Firestore                                                                                           | Realtime listeners for waiting room, live vote count and live results.                                                                                                                                                    |
| Auth                  | Firebase Auth: Google (admins) + Anonymous (voters)                                                       | Per PRD. Admin access = allowlist doc in `admins/{email}`.                                                                                                                                                                |
| Photo storage         | The project's existing bucket `cookie-voting.firebasestorage.app`                                         | Always Free quota (5 GB-months, 100 GB/month egress) applies if the bucket is in US-CENTRAL1/US-EAST1/US-WEST1; likely us-west1, to be confirmed by the owner.                                                            |
| Scoring               | Cloud Functions (2nd gen, Node, `us-west1`) recompute a public results doc                                | Server-side, trusted, ballots stay private. Shared pure logic in `packages/shared`. Same region as the old functions and (likely) the bucket.                                                                             |
| Cookie identification | In-browser: tap-to-select segmentation + manual boxes                                                     | $0, no API key, works offline on the admin's phone. Optional "pre-outline all cookies" evaluated later (Gemini via Firebase AI Logic free tier, or in-browser).                                                           |
| Cookie crops          | **Not stored.** Rendered from the plate photo + normalised box                                            | No crop pipeline, no extra files, box edits are instant, zoom uses full resolution.                                                                                                                                       |
| Hosting               | Firebase Hosting (SPA rewrite), PR preview channels                                                       | Same platform/CLI; 360 MB/day free transfer covers thousands of voter visits (photos are served by Storage, not Hosting).                                                                                                 |
| Component catalogue   | Storybook 10, published to GitHub Pages                                                                   | PRD §13. Every story doubles as a browser test (render + play function + axe a11y).                                                                                                                                       |
| Tests                 | Vitest (unit, jsdom), Storybook story tests (Vitest browser/Chromium), Playwright E2E, Firebase emulators | Everything runs locally/CI without a real Firebase project.                                                                                                                                                               |
| Lint/format           | oxlint + Prettier                                                                                         | Vite template defaults; fast.                                                                                                                                                                                             |

### Alternatives considered

- **Supabase (free):** great fit for SQL scoring, but free projects pause after
  7 idle days and GitHub disables keep-alive cron workflows in repos with no
  commits for 60 days. For a once-a-year app that means a manual resume before
  every event, plus a 200-concurrent realtime connection cap.
- **Convex + Cloudinary:** excellent reactive DX, but only 1 GB/month file
  egress (needs a second vendor for photos) and deployments are disabled when
  free limits are exceeded.
- **Cloudflare Workers + D1 + Durable Objects:** highest free limits and never
  pauses, but auth and realtime fan-out are hand-built and R2 needs a card.
- **Flutter Web:** rejected because the identification tooling is JS/WASM and
  voters would pay a ~2 MB first load.
- **Server-side AI detection (Gemini/Cloud Vision in a function):** the previous
  attempt struggled with detection quality; tap-to-select keeps a human in the
  loop at zero cost. Auto pre-outlining remains an optional later phase.

## Firebase project and environments

| Environment      | Project ID           | Used by                                                                          |
| ---------------- | -------------------- | -------------------------------------------------------------------------------- |
| Production       | `cookie-voting`      | The live app at <https://cookie-voting.web.app>; deployed only by CI from `main` |
| Local, tests, CI | `demo-cookie-voting` | Firebase emulators (the `demo-` prefix means no real project is involved)        |

- **Reused project.** `cookie-voting` hosted the previous attempt, so it already
  has Blaze billing, Firestore, the Storage bucket, Auth and Hosting. Its
  leftovers (old functions, data in the same `events/` paths, permissive test
  rules) must be cleared first; the owner checklist is in
  [SETUP.md](./SETUP.md).
- **Regions.** New Cloud Functions go in `us-west1`, alongside the old
  functions and (probably) the bucket. The Firestore database keeps whatever
  location it was created with; it can't be changed and doesn't matter at this
  scale.
- **Web config** (API key, app ID, bucket, …) is public. The app doesn't commit
  it: in production it loads Hosting's reserved `/__/firebase/init.json`, which
  always matches the project the site is deployed to (live and preview
  channels). Dev, test and `VITE_USE_EMULATORS=true` builds use a demo config
  pointed at the emulators (`apps/web/src/lib/firebase.ts`). Phase 2 planned to
  commit it, but sessions can't reach the live site to copy it, and this way
  nothing can drift.
- **Agent sessions never touch production.** They build and test on the
  emulators; changes reach `cookie-voting` only through the CI deploy workflow.

## Repository layout

```
apps/web/            React SPA (voter + admin), Storybook, Playwright E2E
  src/app/           router, layouts
  src/pages/         route components (admin/, voter/)
  src/components/    reusable UI; each has a *.stories.tsx
  src/styles/        index.css + theme.css (design tokens)
  e2e/               Playwright specs
packages/shared/     Pure TS domain logic: types, ballot rules, Borda scoring
functions/           Cloud Functions; `npm run build` bundles them into functions/dist
firebase/            Rules, indexes, bucket CORS, rules tests, emulator seed script
fixtures/plates/     Real plate photos for detection spikes and E2E tests
docs/                ARCHITECTURE.md (this), ROADMAP.md, SETUP.md (owner steps)
```

`packages/shared` exports TypeScript source directly (no build step). Vite
compiles it for the web app. `functions/build.mjs` bundles the functions with
esbuild (inlining `@cookie-voting/shared`) into `functions/dist`, together with
a generated `package.json` that lists only npm-published dependencies;
`firebase.json` deploys that folder.

Document shapes and paths live in `packages/shared/src/documents.ts`, generic
over the timestamp type so web and functions plug in their own SDK's
`Timestamp`. The web app reads through hooks in `apps/web/src/lib/data.ts`
(`useEvent`, `useCategories`, `useResults`, …), built on `useSubscription`,
which stops each listener on unmount.

## Data model (Firestore)

Visibility is the organising principle: **public documents contain only what a
voter needs**. Baker identities stay hidden until results open (blind voting),
and individual ballots are never public.

```
admins/{email}                          allowlist; doc id = lowercase email
  { addedAt, addedBy? }

adminRequests/{email}                   asking to be an admin          admin + requester
  { requestedAt, name? }

bakers/{bakerId}                        global roster                  admin only
  { name, createdAt }

events/{eventId}                                                       public read
  { name, status: 'setup' | 'voting' | 'results',
    createdAt, updatedAt }

events/{eventId}/categories/{categoryId}                               public read
  { name, order,
    photo: { path, url, width, height } | null,
    cookies: [{ id, box: { x, y, width, height } }] }   // box normalised 0..1

events/{eventId}/private/setup                                         admin only
  { bakerIds: string[],                                 // event roster
    assignments: { [categoryId]: { [cookieId]: bakerId } } }

events/{eventId}/ballots/{uid}          one per voter   create, update while voting: owner; read: owner/admin
  { rankings: { [categoryId]: cookieId[] },             // [1st, 2nd, 3rd]
    submittedAt }

events/{eventId}/results/live           written by Cloud Functions only
  { ballotCount, updatedAt,                              read: admin always,
    categories: CategoryResult[],                        public once status == 'results'
    bakers: BakerStanding[] }
```

Each `CategoryResult` also has `ballotCount` (voters who ranked something in that
category) and each cookie standing has `votes: [1st, 2nd, 3rd]`, the counts behind
its points, for the results page's vote breakdown. Only totals: no ballot is
traceable to a voter. Results written before 2026-10-14 lack both until the next
recompute; the page then just doesn't open a breakdown.

Types for ballots and results are defined in `packages/shared/src/types.ts`.

- **Cookie order and numbers.** The `cookies` array order is the display order.
  The plate editor sorts it into reading order (top-to-bottom, left-to-right)
  on save. Only admins see numbers (`#1…#n` in that order, in the plate editor).
  Voters and the results page show no cookie numbers; the results name the
  baker (owner decision, 2026-10-14). Each voter sees each category's cookies in
  their own shuffled order, so no cookie gains from going first (owner request).
  Screen-reader labels still say "Cookie 3" by position on the voter's screen.
  `stableShuffle` (`packages/shared`) seeds it with the voter's uid and the
  category id, so it's the same on every visit, and orders by a hash of each
  cookie's id, so adding or deleting a cookie mid-vote doesn't move the others.
- **Category name suggestions** come from a collection-group query over
  `categories`, counted by name, which is cheap at this scale.

## Security model

Firestore rules (`firebase/firestore.rules`, tested in `firebase/tests/`):

- `isAdmin()` means a signed-in user with a verified email that has a doc in
  `admins/`.
- `admins/{email}`: a user may read their own doc (so the UI can check admin
  status). Admins may add others (lowercase id, `addedAt` = server time) and
  remove anyone but themselves, so the list is never left empty.
- `adminRequests/{email}`: a signed-in Google user with a verified email may
  create only their own (`requestedAt` = server time, optional `name`); they
  and admins may read or delete it. Approving is one batch: create
  `admins/{email}`, delete the request.
- `bakers/**`, `events/*/private/**`: admins only.
- `events/*` and `events/*/categories/*`: public read, admin write. Admins
  may set any status in any order (owner decision, 2026-10-13: "just have
  everything live update, it'll be the admin's responsibility"), so there are
  no transition or edit locks once votes exist.
- `events/*/ballots/{uid}`: created only when `request.auth.uid == uid` and
  event status is `voting` or `results`. Fields are limited to `rankings` and
  `submittedAt == request.time`. The owner may **update** it only while the
  status is `voting` (owner decision, 2026-10-14: change a category from the
  waiting screen), keeping `submittedAt` and setting `updatedAt == request.time`.
  No delete, so there is one ballot per anonymous user. Readable by its owner
  (to detect "already voted") and by admins.
- `events/*/results/*`: no client writes. Readable by admins, and by everyone
  once the event status is `results`.

Storage rules: `events/{eventId}/plates/{file}` is publicly readable and
writable only by admins (cross-service `firestore.exists` on `admins/`, which needs
the Storage service agent to hold `roles/firebaserules.firestoreServiceAgent`;
SETUP.md §4e). Uploads
must be images under 10 MB.

Ballot _contents_ are validated by the scorer, not by rules. Unknown categories
and cookies, duplicates and extra picks are ignored (`sanitizeRanking`).
Anonymous auth means a determined person can vote again from a new browser,
which the PRD accepts. Scripted abuse (minting anonymous accounts in a loop) is
blocked by App Check with invisible reCAPTCHA Enterprise, initialised in
`lib/firebase.ts` when the build has `VITE_RECAPTCHA_SITE_KEY`, and enforced by the
owner on Cloud Firestore only (SETUP.md §7). Storage stays unenforced because photos
load as plain download URLs. The key allows `web.app` so PR previews pass too; that
lets another `web.app` site request tokens for our app, which is no easier than
driving the real page in a browser.

## Design system

The look is **Classic cozy**: cranberry, pine and gold on warm cream, with
Fredoka for headings and buttons and Nunito for body text. It lives in three
places:

- **Tokens** in `apps/web/src/styles/theme.css`: brand colours each with
  `-hover`, `-subtle` and `on-*` partners, neutrals, status colours, rank
  medals, a focus-ring colour, fonts, radii, warm-tinted shadows and the
  snowfall animation. Re-skinning (PRD §14) is an edit to this file only.
- **Contrast checks** in `apps/web/src/styles/theme.test.ts`: every
  text/background pair components use must reach 4.5:1 and every UI pair
  (input borders, focus ring) 3:1. A new token pair gets a line there.
- **Components** in `apps/web/src/components/`: Alert, Badge, Button, Card,
  ProgressBar, RankBadge, Snowfall, Spinner and TextField, each with stories.
  Storybook's _Foundations_ page shows every colour token, the type pairing
  and a phone-width voter screen built from the components.

Fonts are self-hosted through `@fontsource-variable/*` packages (imported in
`index.css`), so the app and Storybook get the same fonts with no third-party
requests, and browsers only download the Latin subset they need. Motion
respects `prefers-reduced-motion`: snow holds still and spinners stop.

**Link previews and icons.** iMessage, Signal, WhatsApp and Slack read Open Graph
and Twitter card tags from `apps/web/index.html`; their crawlers don't run
JavaScript, so every link (home, event, results) shows the same card: the
1200×630 `public/og-image.png`, title "Cookie Voting" and a one-line description.
`og:image` must be an absolute URL, so it names `https://cookie-voting.web.app`.
`npm run share-images -w @cookie-voting/web` redraws that card, the 180 px
`apple-touch-icon.png` and `favicon.svg` from the theme tokens (the Spinner's
cookie); run it after a re-skin and commit the files. Per-event cards (the event's
name in the preview) would need a Hosting rewrite of `/event/**` to a Cloud
Function that injects tags. Hosting can't route only crawlers, so every voter's
first page load would wait on that function, cold starts included. Not built;
revisit if the owner wants event names in previews.

**Browser toolbars.** Mobile browsers tint their bars to match the page in different
ways, so the app covers all three:

- `<meta name="theme-color">` (cranberry, the app bar's colour) tints the top bar in
  Chrome and Samsung Internet on Android and in Safari before 26.
- Safari 26 (Liquid Glass) ignores theme-color. It samples full-width fixed elements at
  the top and bottom edges, and falls back to the html/body background, which is also
  what shows behind overscroll. `index.css` sets both to cream, or cranberry when the page
  holds a `data-festive` element (ballot, results), so Safari's bars match each page. The
  app bar scrolls away, so on cream pages Safari's top bar is cream too.
- Don't leave full-screen fixed layers mounted when idle: Safari samples them even when
  empty and loses the page colour. `Confetti` unmounts once every piece has fallen.
- `viewport-fit=cover` draws under the notch and, in a home-screen app, the status bar, so
  `--gutter` is at least the side safe-area inset and the app bar and page bottom add the
  top and bottom insets. `color-scheme: light` keeps form controls and browser fallbacks
  light on phones in dark mode (the app has no dark theme).

## Key flows

### Admin sign-in and setup

Admin routes (`/` and `/admin/**`) sit under the `AdminGate` layout route: a
signed-in Google account whose lowercased email has a doc in `admins/` gets
through; anyone else sees the sign-in panel or a "not on the admin list"
message. Sign-in uses `signInWithPopup` (redirect breaks when the auth domain
and the site differ under third-party storage blocking). Emulator builds add
`window.signInForTests(email)` for E2E.

The setup stepper stores nothing: `setupProgress` (`packages/shared/src/setup.ts`)
derives each step's done state from the event status, the roster, the
categories and the assignments. A cookie only counts as assigned while its
baker is on the roster, so removing a baker unassigns their cookies.

**Cookies step (owner decision, 2026-10-14):** boxing cookies and assigning bakers
are one step. `BakerChips` shows the roster (sorted by name) as one scrolling row
above the plate with one baker highlighted; tapping a cookie boxes it
(`PlateEditor`'s `onCreate`) and writes `assignments.{category}.{cookie}` for that
baker. The highlight is derived, not stored: the baker the admin tapped in the row if
any, otherwise `nextBaker` (`packages/shared/src/setup.ts`), the first roster baker
without a cookie on this plate. So a reassignment that leaves someone without a cookie
brings them back, and every admin's screen agrees. With nobody left, a new cookie opens
`BakerMenu` so the admin picks its baker (a second entry). Tapping a box opens the same
menu with its baker marked, placed below the box or above it in the lower half. The
plate never changes by itself: without `?category` the step opens the first unfinished
plate and stays there, and **Next plate** / **Next: Voting** move on. A plate is done
when it has cookies and every one has a roster baker; the Cookies step is done when
every plate is.
The Voting step lists what's left before **Open voting** is enabled; that's the
only gate (owner decision Q1). Status changes go through `useStatusChange`
(`pages/admin/useStatusChange.tsx`): any status in any order (Q2), with a
confirm dialog for the moves voters notice (open results, hide results, close
voting). While live, the event page and each dashboard row show the ballot
count from `results/live`, the voter link (`lib/links.ts`) with Copy and the
phone's Share sheet, and the event page adds a QR code (`qrcode-generator`, drawn
as SVG in the theme's ink).

### Working across devices and admins

Owner requirement (2026-10-13): take the plate photos on a phone, upload them from
the phone's admin page, then carry on with any step on a laptop, another phone or
another admin's account, with everything kept in sync.

- **Live everywhere.** Every admin screen reads through the `lib/data.ts` listener
  hooks, so a change from any device or admin shows up on the others within about
  a second, with no reload. The URL carries the step and plate
  (`?step=cookies&category=…`), so sending the link hands over the exact place.
- **Co-admins** are more docs in `admins/`; there is no per-event ownership, so
  every admin sees and edits every event. Owner decision (2026-10-14), request +
  approve without email: someone signs in with Google, taps **Ask to be an
  admin**, and every admin sees a banner on the dashboard and the request on the
  **Admins** page, where they approve or decline it. The asker's screen lets them
  in the moment they're approved. Admins can also add someone by email there.
- **Edits merge rather than overwrite.** Most writes touch single fields
  (`assignments.{category}.{cookie}`, a category's name, the event status) and
  can't clash. A plate's cookies are one array, so `saveCookies` runs a
  transaction that replays this editor's change (`base` → `next`) onto the array
  as stored now (`mergeCookieEdits` in `packages/shared`): two admins boxing the
  same plate both keep their cookies, and a delete from one device isn't undone
  by a move on another.
- **No offline cache.** Firestore's persistent cache is off; the cookie
  transaction needs a connection. Tap-to-select itself still works offline once
  the model has loaded.
- `e2e/handoff.spec.ts` drives a phone (`admin@example.com`) and a laptop
  (`elf@example.com`, a second seeded admin) through one event.

### Errors

A failed action (a save, an upload, a status change) calls `useShowError()`
(`lib/errors.ts`); `app/ErrorProvider.tsx` pins those errors to the top of the
page until dismissed, so they're seen wherever the admin has scrolled. Errors
loading a page stay inline, where the page would be.

Errors go to **Sentry** (owner decision, 2026-10-14; `lib/monitoring.ts`): every
error shown through `useShowError`, plus anything React catches or can't recover
from (`createRoot` error hooks). Router navigations are traced at 10%. It's only on
in deploy builds with `SENTRY_DSN` (SETUP.md §6), never in dev, tests or emulator
builds. No user details or cookies are sent. With an auth token, the deploy build
uploads hidden source maps and deletes them, so they're never served. It costs
about 10 KB gzipped on every page and fits Sentry's free plan.

**Feedback** (owner decision, 2026-10-15): a 💬 _Feedback_ button in the app bar
(`FeedbackButton`, shown only when Sentry is on) opens Sentry's feedback form, sent
to the same project. No name or email fields (voters are anonymous). Laptops can add
a screenshot and highlight or hide parts of it; Sentry turns screenshots off on
phones and tablets, so instead every report carries a **session replay** of the last
minute. Replay only buffers in memory and is sent when the form opens, never for
errors (`beforeErrorSampling`), which keeps the free plan's 50 replays a month for
feedback. Text and photos show in replays; typed input stays masked. The form, the
screenshot editor and replay (~50 KB) download from Sentry's CDN after load, so the
app bundle grows by only a few KB. Claude reads reports through the Sentry connector
(`issue.category:feedback` in the `cookie-voting` project); they aren't copied to
GitHub (owner: not worth the overhead).

**After a deploy**, a tab opened earlier still asks for the old build's lazy chunks,
which Hosting no longer has. Every route's `lazy` goes through `loadChunk`
(`lib/staleChunk.ts`): on a chunk-load error it reloads the page once (a
`sessionStorage` timestamp stops a loop) and keeps the router's loading state until
then; Vite's `vite:preloadError` does the same. If the reload didn't help, or a page
throws, the route `ErrorBoundary` (`pages/RouteErrorPage.tsx`) shows a friendly
"Try again" card under the app bar and reports to Sentry. Hosting serves everything
with `Cache-Control: no-cache` (revalidate via ETag) except the hashed `/assets/**`
and fonts, which stay immutable, so a reload always gets the current `index.html`.

### Photo upload (admin, phone)

**Bulk (owner decision, 2026-10-13):** the Categories step opens with **Upload
plate photos**, a multi-select picker. Each photo uploads in turn (progress shows
"Uploading photo 2 of 5") and only then becomes a category named "Plate N",
numbered on from the highest existing one (`plateNames`), so an interrupted
upload leaves no empty categories. Uploading is the only way to add a category
(owner, 2026-10-14): a wrong photo is fixed by deleting the category (trash icon,
with a confirm) and uploading again. Admins name plates on any device. "Plate N"
names are never offered as suggestions for later events.

Each photo:

1. `<input type="file" accept="image/jpeg,image/png">` opens the camera or
   gallery (phones convert HEIC to JPEG for this filter).
2. Decode with `createImageBitmap(file, { imageOrientation: 'from-image' })` so
   EXIF rotation is applied.
3. Downscale to a 2048 px long edge, encode JPEG at quality 0.85 (~300–600 KB).
4. Upload to `events/{eventId}/plates/{uuid}.jpg` with
   `Cache-Control: public, max-age=31536000, immutable`. Store `{path, url,
width, height}` on the category.

The work lives in `apps/web/src/lib/photo.ts` (decode, `OffscreenCanvas`
resize, encode) and `storage.ts` (resumable upload with progress). Each
category's name is a text field on its card that saves itself after a pause in
typing, on Enter and on leaving the field; an empty name or one another category
has is never saved. Renames from other devices show up unless that field is
being edited. A `<datalist>` suggests names from past events, ranked by how often
they were used (`suggestCategoryNames` in `packages/shared`).

Categories reorder by drag handle with dnd-kit (pointer, touch and keyboard
sensors; custom screen-reader announcements). Dragging is handle-only so the
rest of the row scrolls normally on phones. Deleting a category always works
(owner decision Q2: no locks); the confirm dialog warns how many ballots exist,
and deleting removes its photo and its cookies' baker assignments.

The bucket needs a CORS config allowing `GET` so the in-browser model can read
pixels from already-uploaded photos. `firebase/storage-cors.json` allows any
origin: the photos are public anyway, and Cloud Storage can't wildcard part of
an origin, which hosting preview channels (`cookie-voting--pr12-….web.app`)
would need. The deploy job applies it with `gcloud storage buckets update`.

### Identifying cookies (admin, phone)

The plate editor shows the photo with cookie boxes overlaid:

- **Tap-to-select (primary):** tap a cookie and a segmentation model running in
  the browser returns a mask, which becomes a tight bounding box. See
  [Tap-to-select](#tap-to-select) for the model and how it was chosen.
- **Manual:** a tap that tap-to-select can't box (or any tap while it loads or
  if it's unavailable) adds a box there, square on screen, to fit with the corner
  handles; drag a box to move it; delete it from its baker menu (or Delete).
  `PlateEditor` (the Cookies step) does this with pointer events and nothing
  around the photo (owner, 2026-10-14: no zoom buttons, count line, Add cookie
  or Delete buttons). Pinch or the scroll wheel zooms on the pointer, dragging
  the photo pans it once zoomed in, and hints float over the photo.
  The photo fills the window below the rows above it (at least half the window
  height), so a 1080p laptop shows the whole step without scrolling; on short
  screens `touch-action: none` over the photo still leaves page above and below
  it to scroll by. The event's name sits in the red app bar (`AppBarContent`
  portals into `AppLayout`; the cookie and "Cookie Voting" go home), the setup
  steps are a progress stepper (`Stepper`), plates are photo thumbnails
  (`PlateTabs`), bakers stay round chips, the whose-turn prompt floats on the
  photo and Next plate sits under it (owner's picks, 2026-10-14). Handles,
  numbers and outlines are counter-scaled to stay finger-sized at any zoom.
  Keyboard users Tab to a box: arrows move it, Shift + arrows resize it, Delete
  removes it, and an **Add cookie** button that only shows when focused places a
  box in the middle of the view. Each finished gesture is one save; deleting a
  cookie also clears its baker assignment. Replacing a category's photo keeps
  its boxes, for the admin to adjust.
- **Pre-outline (optional, phase 11): not shipped.** A "find all cookies"
  button was measured against the same fixtures (2026-10-13). It tapped an
  8 × 6 grid with tap-to-select, re-tapped each box's centre, and dropped
  boxes that touched the photo edge, covered over 25% of it, or duplicated
  another box (IoU ≥ 0.5). It found 86/95 cookies at IoU ≥ 0.8 (90.5%), but
  added 48 wrong boxes (about 3 per plate: mat, counter, two cookies in one
  box) and took a median 14 s per plate on a laptop CPU, likely 30 s or more
  on a phone. Skipping grid points inside found boxes was faster but missed
  more (83%). Tapping each cookie is quicker overall and leaves nothing to
  clean up, so tap-to-select stays. Gemini via Firebase AI Logic
  was not tried: it needs console setup, and free-tier prompts may be used by
  Google.

The PRD's "merge two detections" is dropped. It existed to fix AI
over-segmentation, and resizing a box covers it.

### Tap-to-select

**Model: MediaPipe Interactive Segmenter, `magic_touch`** (`@mediapipe/tasks-vision`,
the `InteractiveSegmenterLegacy` API that takes a keypoint). Phase 6 measured it by
tapping the centre of every ground-truth cookie in `fixtures/plates` (95 cookies,
17 photos) in headless Chromium:

| Input to the model                                 | Boxes with IoU ≥ 0.8 | Mean IoU |
| -------------------------------------------------- | -------------------- | -------- |
| Whole photo                                        | 87 / 95              | 0.90     |
| Crop of 50% of the long edge around the tap        | 89 / 95              | 0.93     |
| **Crop of 60% of the long edge around the tap** ✅ | **92 / 95**          | **0.94** |
| Crop of 75% of the long edge around the tap        | 91 / 95              | 0.93     |

- Cropping helps because the cookie fills more of the model's 512 px input and
  there's less tray or towel for it to pick by mistake. The crop is resized to
  512 px on its long edge; 256 and 768 px scored the same or worse.
- The box is the connected mask region (confidence > 0.5) under the tap, or the
  nearest one within 3% of the width. A region touching three or more sides of
  the crop is the background, so the tap reports "couldn't find a cookie" and the
  admin draws the box instead. Of the three misses, one was the background (now
  rejected), and two were part of a cookie (icing split from the base); the
  admin resizes those.
- The candy-topped cookie (`8-cookies_PXL…`, #3) boxes correctly: the model
  includes the toppings.
- Speed in the sandbox's headless Chromium (CPU, no GPU): ~0.4 s to load, ~0.3 s
  per tap. Phones with WebGL may be faster; it's the same order either way.
- Download, admin-only and lazy (only the Cookies step imports it): the model is
  6.2 MB and the WebAssembly runtime 3.4 MB gzipped. Both are served from
  Hosting as hashed, immutable assets, so they download once per device. The
  model file is committed (`apps/web/src/lib/cookieFinder/magic_touch.tflite`,
  version 1 from Google's model bucket) so tests need no network.
- **Off-centre taps and split icing (2026-10-13).** Real fingers rarely hit
  the middle, so the shipped code was re-measured tapping each cookie at its
  centre and at 8 points halfway to its box edge (855 taps). Most misses were
  partial boxes where the model split the icing from the base. Bridging mask
  gaps of up to 6 px (of 512) when flood-filling fixes many of them without
  merging neighbouring cookies:

  | Mask handling             | Centre taps, IoU ≥ 0.8 | Halfway taps, IoU ≥ 0.8 |
  | ------------------------- | ---------------------- | ----------------------- |
  | Region under the tap      | 90 / 95                | 686 / 760 (90.3%)       |
  | **Bridge gaps ≤ 6 px** ✅ | **92 / 95**            | **692 / 760 (91.1%)**   |
  | Bridge gaps ≤ 10 px       | 92 / 95                | 688 / 760               |
  | Threshold 0.35 or 0.2     | 92 / 95                | 686–688 / 760           |

  Re-tapping the centre of the found box and keeping the bigger result added
  about 2 points more but doubles the time per tap, so it isn't used. At 70% of
  the way to the edge, taps on star- or person-shaped cookies often miss the
  cookie itself (about 80% boxed correctly).

- **SlimSAM wasn't measured.** This sandbox can't reach Hugging Face, where
  Transformers.js fetches it. MediaPipe already clears the bar (the E2E taps a
  real plate and requires IoU ≥ 0.8 for every cookie), so the comparison isn't
  worth a CI job unless tap accuracy disappoints on real phones.
- If the runtime or model fails to load (old phone, blocked download), the editor
  says so and taps still add boxes to fit by hand. A tap whose box overlaps an existing one
  (IoU ≥ 0.5) selects that one instead of adding a duplicate.

### Rendering a cookie

A cookie image is the plate photo shown through a window. A container with the
box's aspect ratio and `overflow: hidden` holds an `<img>` scaled to
`100% / box.width` and offset by `-box.x / box.width` and `-box.y / box.height`.
Voters download each plate photo once (browser-cached) instead of N crop files.

### Voting

Every category needs a full set of picks (1st, 2nd and 3rd, or as many as the
category has cookies, per `maxPicksFor`) before the ballot can be submitted
(owner decision, 2026-10-13). This is enforced by the voter UI; the scorer
still accepts partial ballots.

Voters sign in anonymously on page load (`useVoter` in `lib/auth.ts`).
Selections live in React state in `BallotFlow` (`awardPlace` from
`packages/shared`) and survive moving between categories, but not a reload.
Submit writes `events/{eventId}/ballots/{uid}` once (`lib/ballots.ts`, kept
apart from `lib/mutations.ts` so the voter chunk doesn't load Storage). The
page listens to the voter's own ballot doc: once it exists, the voter sees the
waiting room (`WaitingRoom`). The submit itself also moves the page on as soon
as the server accepts the write, and a saved category change shows at once,
without waiting for that listener: Firestore reports a write as saved only once
the listen connection has caught up too, and phones (iPhones especially) can
leave that connection stalled while writes still go through (2026-10-15 reports:
voters stuck on the spinning submit button). If a send or a voter page's load
runs past 10 s (`useTakingLong`), the page says so and offers a retry
(`SlowNotice`: reconnect Firestore for a send, which resends the queued write;
reload for a load, `PageLoading`) and logs a Sentry warning. A resend whose
first try already landed is refused by the rules, so `submitBallot` then reads
the ballot back and counts it as sent. The waiting room moves to `/event/:id/results` when `status`
becomes `results`. Voting stays open while results show, with a banner linking
to them. A late voter, who sends their ballot while results show, lands on the
waiting room's thank-you and their picks (read-only, since ballots can't change
once results open) with a View results button (owner decision, 2026-10-15);
only after that visit, or for anyone who voted earlier, does the voting link go
straight to the results. The results page uses the same anonymous voter and,
when they have no ballot, shows a "Haven't voted yet? Vote now" link back to
the voting page.

The waiting room (owner decision, 2026-10-14) shows one of three festive scenes
(`WaitingScene`: dancing snowman, snow globe, oven), picked at random on each
visit; tapping the scene makes the character react, with no hint. Under it,
`PicksSummary` lists the sent picks as cookie photos with medals. Tapping a
category opens it (`?edit=<categoryId>`, so the phone's back button closes it)
in the same `CategoryStep` the ballot uses, starting from the sent picks;
"Save my picks" writes just that category (`updateBallotCategory`) and comes
back. A category added after the voter sent their ballot shows "No votes here
yet" and can be voted in the same way. Changes are only possible while the
event is `voting`; once results open the voter is on the results page.

### Results page

`/event/:id/results` listens to the event and, only once its status is
`results`, to `results/live` (`useResults(null)` until then: a read the rules
deny would end the listener). Cookie crops come from the category docs, which
the page already reads for the voter flow. Voters who have voted are sent here
from `/event/:id` when results open; others keep voting with a banner linking
here. Ties share a competition rank (`competitionRanks`) and show "Tied 2nd".

Layout (owner decision 2026-10-14, "Ornaments"): the cranberry festive page, with a
`SlideShow` of one slide per category, then **Top bakers**, then **All results**.
Each category slide hangs its top three from a garland as `Ornaments` (1st biggest,
lowest, in the middle; strings start on the garland's curve, `layout.ts`). The first
time a slide is on screen it plays a timed reveal (`reveal.ts`/`useReveal`, about
5 s): the ornaments lower on unrolling strings, closed, then open 3rd, 2nd, 1st with
a drumroll before each and confetti for the winner. Leaving mid-way or Skip opens
them all; with reduced motion they start open. Top bakers uses the same ornaments,
each baker's picture being their best-scoring cookie. All results is one vertically
scrolling list: `BakerLeaderboard` ("Bakers": rank, cookie count, total) first, then
every category's `CategoryResults`. Tapping an open ornament or a cookie row opens
`VoteBreakdown`: the cookie's 1st/2nd/3rd vote counts, "Not in their top 3"
(category voters minus those), and the points each place earned. Tapping a baker
(their row, or their Top bakers ornament) opens `BakerBreakdown` (owner decision
2026-10-14): their cookies best first (`bakerCookies` in `packages/shared`), each
with its category, place ("2nd of 5") and points, under a points bar split per
cookie. Hovering or tapping a piece of the bar lights up its row and names it in a
bubble; hovering a row lights up its piece. A cookie row opens its `VoteBreakdown`
on top, and closing that returns to the baker.

### Scoring (Cloud Functions)

`recomputeResults(eventId)` (`functions/src/recomputeResults.ts`) reads the
categories, `private/setup`, the roster's baker names and all ballots in one
read-only transaction, which gives a consistent snapshot without locking
voters' ballots. It runs `tallyResults` from `packages/shared` and writes
`results/live`. It is triggered by:

- ballot written (sent, or a category changed from the waiting room)
- `private/setup` written (roster or baker assignments changed)
- a category written (added, renamed, reordered, deleted, cookies changed)
- event `status` changed

Recomputing from scratch is idempotent and self-healing. It costs about N reads
per ballot (~20K reads for a 200-voter event, within the 50K/day free quota).
The results doc stores the snapshot's `sourceReadTime`, and a transaction only
overwrites it with results from a snapshot at least as new. Every trigger fires
after its change commits, so the recompute that starts last sees everything and
wins; concurrent recomputes can't regress. Functions run in `us-west1` with
`maxInstances: 10`. If events grow beyond ~500 voters, switch to incremental
per-cookie counters.

A ballot pick for a cookie that has since been deleted is dropped by
`sanitizeRanking`, and the voter's later picks in that category move up.

Admins watch `results/live.ballotCount` for the live vote count (one listener,
one read per update).

## Free-tier budget (200 voters, 15 categories, 8 cookies each)

| Resource                              | Per event | Free quota   |
| ------------------------------------- | --------- | ------------ |
| Photo storage (15 × ~450 KB)          | ~7 MB     | 5 GB         |
| Photo egress (200 voters × 15 photos) | ~1.4 GB   | 100 GB/month |
| Hosting transfer (~300 KB gz × 200)   | ~60 MB    | 360 MB/day   |
| Firestore reads (tally + listeners)   | ~30K      | 50K/day      |
| Firestore writes                      | < 1K      | 20K/day      |
| Function invocations                  | ~250      | 2M/month     |
| reCAPTCHA assessments (App Check)     | ~200–400  | 10K/month    |

The voter bundle measured at phase 10 is about 300 KB gzipped (the Firebase
SDK is 170 KB of it). Admins also download the tap-to-select model and runtime
(~10 MB) once per device, which is fine for a handful of admins. Once results
open, every open results page gets one read per recompute; late ballots are
few, so this stays small (200 viewers × 20 late ballots = 4K reads).

Set a Google Cloud budget alert (e.g. $1) on the Blaze project as a tripwire.

## Deviations from the PRD

| PRD                                                          | Now                                                           | Reason                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------- |
| Next.js on Vercel                                            | Vite React SPA on Firebase Hosting                            | No SSR needed; one platform; lazy admin chunks.       |
| Gemini detection in a Cloud Function                         | In-browser tap-to-select + manual; optional pre-outline later | $0, works on phones, human-in-the-loop accuracy.      |
| Cropped JPEGs stored per cookie                              | Crops rendered from plate photo + box                         | Simpler, fewer files, instant edits.                  |
| Merge two cookies                                            | Resize/move boxes                                             | Merge only compensated for AI over-segmentation.      |
| Compress only if > 5 MB                                      | Always downscale to 2048 px long edge                         | Phone photos are 12 MP; smaller, faster everywhere.   |
| Delete a category only while no votes exist                  | Delete any time, with a warning that names the ballot count   | Owner decision Q2: no locks, admin responsibility.    |
| All event subcollections public                              | Ballots private; baker assignments hidden until results       | Privacy and blind voting.                             |
| Results aggregated from `userVotes` (implicitly client-side) | Cloud Function writes `results/live`                          | Owner requirement: scoring in the cloud; fewer reads. |
| `userVotes`, `bakerIds` on event                             | `ballots`, roster in `private/setup`                          | Naming, visibility.                                   |
| Playwright component tests                                   | Storybook story tests (Vitest browser mode + Playwright)      | Stories and tests are the same artefact.              |
