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
   identifying cookies on plate photos.
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
- **Web config** (API key, app ID, bucket, …) is public and gets committed to the
  repo; it's readable at <https://cookie-voting.web.app/__/firebase/init.json>.
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
functions/           Cloud Functions (added in roadmap phase 2)
firebase/            Firestore/Storage rules + indexes (phase 2)
fixtures/plates/     Real plate photos for detection spikes and E2E tests
docs/                ARCHITECTURE.md (this), ROADMAP.md, SETUP.md (owner steps)
```

`packages/shared` exports TypeScript source directly (no build step). Vite
compiles it for the web app; Cloud Functions will bundle it with esbuild so the
deployed `functions/package.json` only lists npm-published dependencies.

## Data model (Firestore)

Visibility is the organising principle: **public documents contain only what a
voter needs**. Baker identities stay hidden until results open (blind voting),
and individual ballots are never public.

```
admins/{email}                          allowlist; doc id = lowercase email
  { addedAt }

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

events/{eventId}/ballots/{uid}          one per voter   create: owner; read: owner/admin
  { rankings: { [categoryId]: cookieId[] },             // [1st, 2nd, 3rd]
    submittedAt }

events/{eventId}/results/live           written by Cloud Functions only
  { ballotCount, updatedAt,                              read: admin always,
    categories: CategoryResult[],                        public once status == 'results'
    bakers: BakerStanding[] }
```

Types for ballots and results are defined in `packages/shared/src/types.ts`.

- **Cookie order and numbers.** The `cookies` array order is the display order.
  The plate editor sorts it into reading order (top-to-bottom, left-to-right)
  on save, and voters see numbers `#1…#n` in that order.
- **Category name suggestions** come from a collection-group query over
  `categories`, counted by name, which is cheap at this scale.

## Security model

Firestore rules (to be written in phase 2, with emulator tests):

- `isAdmin()` means a signed-in user with a verified email that has a doc in
  `admins/`.
- `admins/{email}`: a user may read their own doc (so the UI can check admin
  status). Admins may read and write.
- `bakers/**`, `events/*/private/**`: admins only.
- `events/*` and `events/*/categories/*`: public read, admin write.
- `events/*/ballots/{uid}`: **create only**, only when `request.auth.uid == uid`
  and event status is `voting` or `results`. Fields are limited to `rankings`
  and `submittedAt == request.time`. No update or delete, so there is one ballot
  per anonymous user. Readable by its owner (to detect "already voted") and by
  admins.
- `events/*/results/*`: no client writes. Readable by admins, and by everyone
  once the event status is `results`.

Storage rules: `events/{eventId}/plates/{file}` is publicly readable and
writable only by admins (cross-service `firestore.exists` on `admins/`). Uploads
must be images under 10 MB.

Ballot _contents_ are validated by the scorer, not by rules. Unknown categories
and cookies, duplicates and extra picks are ignored (`sanitizeRanking`).
Anonymous auth means a determined person can vote again from a new browser,
which the PRD accepts. App Check can be added at launch to deter scripted abuse.

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

## Key flows

### Photo upload (admin, phone)

1. `<input type="file" accept="image/*">` opens the camera or gallery.
2. Decode with `createImageBitmap(file, { imageOrientation: 'from-image' })` so
   EXIF rotation is applied.
3. Downscale to a 2048 px long edge, encode JPEG at quality 0.85 (~300–600 KB).
4. Upload to `events/{eventId}/plates/{uuid}.jpg` with
   `Cache-Control: public, max-age=31536000, immutable`. Store `{path, url,
width, height}` on the category.

The bucket needs a CORS config allowing `GET` from the app origin so the
in-browser model can read pixels from already-uploaded photos (phase 2 setup).

### Identifying cookies (admin, phone)

The plate editor shows the photo with cookie boxes overlaid:

- **Tap-to-select (primary):** tap a cookie and a segmentation model running in
  the browser returns a mask, which becomes a tight bounding box. Candidates are
  MediaPipe Interactive Segmenter (`magic_touch`, built for mobile) and SlimSAM
  via Transformers.js. Phase 6 picks one by measuring accuracy and speed on
  `fixtures/plates`. The model is lazy-loaded on admin routes only.
- **Manual:** drag to draw a box; drag handles to resize; drag to move; delete.
- **Pre-outline (optional, phase 11):** a "find all cookies" button, evaluated
  against the same fixtures.

The PRD's "merge two detections" is dropped. It existed to fix AI
over-segmentation, and resizing a box covers it.

### Rendering a cookie

A cookie image is the plate photo shown through a window. A container with the
box's aspect ratio and `overflow: hidden` holds an `<img>` scaled to
`100% / box.width` and offset by `-box.x / box.width` and `-box.y / box.height`.
Voters download each plate photo once (browser-cached) instead of N crop files.

### Voting

Voters sign in anonymously on page load. Selections live in React state
(`toggleRanking` from `packages/shared`). Submit writes
`events/{eventId}/ballots/{uid}` once. The waiting screen listens to the event
doc and switches to results when `status` becomes `results`.

### Scoring (Cloud Functions)

`recomputeResults(eventId)` reads the categories, `private/setup`, the roster's
baker names and all ballots. It runs `tallyResults` from `packages/shared` and
writes `results/live`. It is triggered by:

- ballot created
- `private/setup` written (baker assignments changed)
- event `status` changed

Recomputing from scratch is idempotent and self-healing. It costs about N reads
per ballot (~20K reads for a 200-voter event, within the 50K/day free quota). A
transaction only overwrites `results/live` if its `ballotCount` is not newer, so
concurrent recomputes can't regress. If events grow beyond ~500 voters, switch
to incremental per-cookie counters.

Admins watch `results/live.ballotCount` for the live vote count (one listener,
one read per update).

## Free-tier budget (200 voters, 15 categories, 8 cookies each)

| Resource                              | Per event | Free quota   |
| ------------------------------------- | --------- | ------------ |
| Photo storage (15 × ~450 KB)          | ~7 MB     | 5 GB         |
| Photo egress (200 voters × 15 photos) | ~1.4 GB   | 100 GB/month |
| Hosting transfer (~150 KB gz × 200)   | ~30 MB    | 360 MB/day   |
| Firestore reads (tally + listeners)   | ~30K      | 50K/day      |
| Firestore writes                      | < 1K      | 20K/day      |
| Function invocations                  | ~250      | 2M/month     |

Set a Google Cloud budget alert (e.g. $1) on the Blaze project as a tripwire.

## Deviations from the PRD

| PRD                                                          | Now                                                           | Reason                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------- |
| Next.js on Vercel                                            | Vite React SPA on Firebase Hosting                            | No SSR needed; one platform; lazy admin chunks.       |
| Gemini detection in a Cloud Function                         | In-browser tap-to-select + manual; optional pre-outline later | $0, works on phones, human-in-the-loop accuracy.      |
| Cropped JPEGs stored per cookie                              | Crops rendered from plate photo + box                         | Simpler, fewer files, instant edits.                  |
| Merge two cookies                                            | Resize/move boxes                                             | Merge only compensated for AI over-segmentation.      |
| Compress only if > 5 MB                                      | Always downscale to 2048 px long edge                         | Phone photos are 12 MP; smaller, faster everywhere.   |
| All event subcollections public                              | Ballots private; baker assignments hidden until results       | Privacy and blind voting.                             |
| Results aggregated from `userVotes` (implicitly client-side) | Cloud Function writes `results/live`                          | Owner requirement: scoring in the cloud; fewer reads. |
| `userVotes`, `bakerIds` on event                             | `ballots`, roster in `private/setup`                          | Naming, visibility.                                   |
| Playwright component tests                                   | Storybook story tests (Vitest browser mode + Playwright)      | Stories and tests are the same artefact.              |
