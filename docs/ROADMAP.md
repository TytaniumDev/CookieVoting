# Roadmap

The build is split into phases, each sized for one agent session. Work top to
bottom: a phase starts only when the ones before it are done, unless it says
otherwise. Design context lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md);
product requirements in [`../ClaudePRD.md`](../ClaudePRD.md).
[`PRD-COVERAGE.md`](./PRD-COVERAGE.md) maps every PRD requirement to the phase
that builds it; flip its rows to ✅ when a phase ships.

**How to use this file (agents):** pick the first phase that isn't ✅, do it,
tick its boxes, set its status, and add an entry to the session log at the
bottom: what shipped, anything deferred, and notes for the next session. If a
phase is too big, finish a coherent slice, mark it 🚧 and list what remains.

Status: ✅ done · 🚧 in progress · ⬜ not started

---

## Phase 0 — Decisions ✅

- [x] Choose stack under free-tier constraints (see ARCHITECTURE.md → Decisions)
- [x] Record PRD deviations

## Phase 1 — Foundation ✅

- [x] npm workspaces: `apps/web`, `packages/shared`
- [x] Vite + React + TS app with PRD routes (lazy-loaded pages), Tailwind v4 design tokens
- [x] `packages/shared`: domain types, ballot selection rules, Borda scoring with competition ranks (unit tested)
- [x] Storybook 10 with story tests (render + play + axe) via Vitest browser mode
- [x] Playwright E2E smoke tests on mobile + desktop profiles
- [x] CI: format, lint, typecheck, unit, build, story tests, E2E; Storybook → GitHub Pages on `main`

## Phase 2 — Firebase backend foundation ✅

Build and test everything against the emulators with the `demo-cookie-voting`
project ID. Production is the existing `cookie-voting` project (see
ARCHITECTURE.md → Firebase project and environments, and `docs/SETUP.md`).

- [x] `firebase.json`, `.firebaserc` (default project `cookie-voting`), emulator config (auth, firestore, storage, functions, hosting); emulator scripts pass `--project demo-cookie-voting`
- [x] `firebase/firestore.rules` + `firebase/storage.rules` per ARCHITECTURE.md → Security model
- [x] Rules unit tests with `@firebase/rules-unit-testing` (admin vs voter vs anonymous; ballot create-once; results visibility by status)
- [x] `functions/` workspace (region `us-west1`): 2nd-gen triggers calling `recomputeResults(eventId)` → `tallyResults`; bundled with esbuild so `@cookie-voting/shared` is inlined
- [x] Function integration tests on the emulator (ballot → results doc; assignment change → recompute; concurrent ballots don't regress `ballotCount`)
- [x] Storage bucket CORS config (`firebase/storage-cors.json`), applied by the deploy job
- [x] `apps/web/src/lib/firebase.ts`: typed client init; production config from Hosting's `/__/firebase/init.json` instead of a committed copy (see ARCHITECTURE.md); auto-connect to emulators in dev/test
- [x] Typed Firestore converters/hooks layer (`useEvent`, `useCategories`, …) with listener cleanup
- [x] Seed script: an event with categories using `fixtures/plates` photos, bakers, assignments, ballots
- [x] CI job running rules + functions tests under `firebase emulators:exec`
- [x] Emulator JARs pre-fetched in `.claude/hooks/session-start.sh`
- [x] Deploy jobs in CI: on `main`, deploy rules, indexes, functions (`--force`) and hosting to `cookie-voting`, then bucket CORS; hosting preview channel per PR. Skipped with a notice while the deploy secret isn't configured
- [x] Replaced `docs/SETUP.md` section 4 with the deploy-credential steps

**Done when:** `npm run test:emulators` passes locally and in CI; the web app can read seeded data from the emulators.

## Phase 3 — Admin sign-in, dashboard, events, bakers ✅

- [x] Google sign-in (popup); allowlist check against `admins/{email}`; friendly "not an admin" state
- [x] Route guard for `/admin/**` and the dashboard at `/` (`AdminGate` layout route)
- [x] Dashboard: event list (name, status, created date, current setup step) → event page
- [x] Create event (`/admin/events/new`)
- [x] Event setup page with a stepper whose steps are **derived from data** (`setupProgress` in `packages/shared`), each step reachable; the opening step stays put while the admin works
- [x] Bakers step: event roster from the global list (type-to-search), create new baker (saved globally + added), remove from event (unassigns their cookies, Q4)
- [x] Stories for every new component (Stepper, EventCard, BakerRoster, SignInPanel); E2E: admin signs in (auth emulator), creates an event, adds and removes bakers; non-admin turned away

## Phase 4 — Categories & plate photos ✅

- [x] Add / rename / delete categories (owner decision Q2: delete always works, the dialog warns with the ballot count)
- [x] Name suggestions ranked by frequency of use across past events
- [x] Drag-to-reorder that works with touch (e.g. dnd-kit), persisting `order`
- [x] Photo capture/upload from phone camera or gallery: EXIF-aware decode, downscale to 2048 px, JPEG 0.85, upload with progress (replacing a photo was dropped 2026-10-14: delete and re-upload)
- [x] `CookieImage` component: renders a cookie from plate photo + normalised box (ARCHITECTURE.md → Rendering a cookie)
- [x] Stories + E2E (upload a fixture photo on the mobile profile)

## Phase 5 — Plate editor (manual, mobile-first) ✅

- [x] Photo with box overlay; pinch-zoom and pan on phones
- [x] Draw box by dragging; select; move; resize via handles sized for fingers; delete
- [x] Save sorts cookies into reading order; show numbers `#1…#n`
- [x] Cookies stay editable in every status (owner decision Q2: no locks; results recompute live)
- [x] Label ground truth (checked on overlays) for every `fixtures/plates/*.jpg` → `fixtures/plates/*.json` (boxes), for measuring detection in phases 6 and 11
- [x] Geometry helpers in `packages/shared` (clamp, normalise, reading order, IoU) with unit tests
- [x] Stories + E2E on the mobile profile (draw, resize, delete)

## Phase 6 — Tap-to-select ✅

- [x] Spike: MediaPipe Interactive Segmenter (`magic_touch`) vs SlimSAM (Transformers.js) (SlimSAM not measured: Hugging Face is unreachable from the sandbox; MediaPipe met the bar). Tap each ground-truth cookie centre in `fixtures/plates`, then measure box IoU, model download size, first-tap latency and per-tap latency. Record results in ARCHITECTURE.md
- [x] Watch for cookies with toppings (e.g. candies on a cookie): a tap may select only the topping. Prefer the mask that best matches a whole cookie (multi-mask output / largest plausible region)
- [x] Integrate the winner as a lazy-loaded, admin-only module; tap a cookie → box added; tap a box → select it
- [x] Graceful fallback to manual drawing if the model fails to load (old phone, offline)
- [x] E2E on fixture photos: tapping centres yields boxes with IoU ≥ 0.8 against ground truth

## Phase 7 — Baker assignment & opening voting ✅

- [x] Per category: cookie crops with a type-to-filter baker picker (no pre-selection of the previous baker)
- [x] Validation gating: every category has a photo and ≥ 1 cookie, every cookie has a baker
- [x] Open voting → share panel with the voter URL, copy button and QR code
- [x] Live ballot count on the dashboard (from `results/live.ballotCount`)
- [x] Open results button
- [x] Dashboard rows for events in `voting`/`results` show the live count, voter URL and Open results too (PRD §10)

## Phase 8 — Voter flow ✅

- [x] Anonymous sign-in on load; "already voted" detection → waiting/results
- [x] Landing: event name, ordered category list, "Start voting"
- [x] One category at a time, progress indicator, forward/back + swipe
- [x] Adaptive grid that fits all cookies on screen where possible; tap to rank (badges 1/2/3), tap again to unrank with renumbering (`toggleRanking`); 🔍 zoom modal
- [x] Every category needs all its picks before moving on to review (owner decision Q3)
- [x] Review screen → submit (create-once ballot) → waiting screen that follows event status live
- [x] Voting closed / event not found states
- [x] Stories + E2E: full vote on the mobile profile against the emulators, double-submit rejected

## Phase 9 — Results ✅

- [x] `/event/:eventId/results` and in-flow results from `results/live` (live listener)
- [x] Per-category rankings with tied ranks, crop, baker name, points
- [x] Overall baker leaderboard with ties
- [x] Friendly "results aren't open yet" state when `/results` is visited early
- [x] Celebration moment (confetti or similar, respecting `prefers-reduced-motion`)
- [x] E2E: votes → results reflect Borda scores

## Phase 10 — Launch 🚧

- [x] Festive polish: subtle snow animation (reduced-motion aware), imagery, empty states, copy
- [x] Accessibility and 375 px layout pass on every voter screen (`e2e/voter-a11y.spec.ts`)
- [x] Desktop: the voting grid widens so a plate fits on a laptop screen too
- [x] Production check of the deploy workflow (every merge to `main` deploys green); no workflow uses the old `FIREBASE_TOKEN` / `VITE_*` secrets any more
- [x] App Check (reCAPTCHA Enterprise) in the web app, on when `RECAPTCHA_SITE_KEY` exists
- [ ] Owner: create the key and enforce App Check on Cloud Firestore (SETUP.md §7)
- [ ] Owner: delete the old secrets, then a dry-run event on real phones (Owner actions below)

## Phase 11 — Optional: pre-outline all cookies ✅ (measured, not shipped)

Can start any time after phase 5 (it needs the ground truth).

- [x] Spike: in-browser grid of tap-to-select taps, scored against `fixtures/plates/*.json` (Gemini skipped: needs console setup and shares photos with Google)
- [x] Decision: 90.5% recall but ~3 wrong boxes per plate and ~14 s+ per plate, so no button; tap-to-select stays (ARCHITECTURE.md → Identifying cookies)

## Phase 12 — Phone-to-laptop handoff ✅

Owner requirement (2026-10-13): photograph and upload plates from a phone, then
carry on with any admin step on a laptop or another admin's device, kept in sync.

- [x] Bulk upload: pick every plate photo at once; each becomes "Plate N" to rename anywhere (owner chose this over a photo tray)
- [x] Plate edits from two devices or admins merge instead of overwriting (`mergeCookieEdits`, transactional `saveCookies`)
- [x] E2E: phone and laptop, two admins, one event (`e2e/handoff.spec.ts`)

## Phase 13 — Adding admins ✅

Owner decision (2026-10-14): request + approve, no email.

- [x] Admins page: list, add by Google email, remove (not yourself)
- [x] Non-admins tap "Ask to be an admin"; admins see a dashboard banner and approve or decline on the Admins page; the asker is let in live
- [x] Rules + tests for `admins/` writes and `adminRequests/`; E2E in `e2e/admins.spec.ts`

## Phase 14 — One Cookies step: box and tag ✅

Owner feedback (2026-10-14): the Cookies step jumped to the next plate after the
first box and didn't show what a tap did. Owner asked for boxing and baker
assignment in one step; picked from mocks (baker chips above the photo).

- [x] Baker chips row with the next baker highlighted; a tap boxes and tags (`BakerChips`, `nextBaker`)
- [x] Tap a box to reassign or delete (`BakerMenu`); extra cookies ask who baked them
- [x] No auto-advance: Next plate / Next: Voting; the Assign bakers step is gone
- [x] PRD updated, with the bulk upload and category card changes recorded

## Phase 15 — Cookies step fits a 1080p screen ✅

Owner feedback (2026-10-14): no vertical scrolling on a 1080p laptop. Mocks of
four header layouts are in the Artifact "Cookies Step Header Mocks".

- [x] Remove the zoom row (−, +, Fit, Add cookie), the cookie count and the Delete cookie button
- [x] A tap adds a box where tap-to-select can't; the scroll wheel zooms and dragging pans
- [x] Event name in the red bar, steps as a progress stepper, plates as photo thumbnails, prompt on the photo, Next plate under it; the photo fills the rest of the window

## Phase 16 — Festive Spotlight ballot ✅

Owner feedback (2026-10-14): the voting page was "really bland"; make it
festive, with the cookie photos as large as the screen allows. Mocks are in the
Artifacts "Festive Voting Mockups" (four directions) and "Spotlight Voting
Mockup" (three rounds on the one picked).

- [x] Cranberry page with snow while voting (`data-festive` on the page; `AppLayout` does the rest)
- [x] Cookie thumbnails under the category name (`CookieStrip`), centred, scrolling sideways only when they don't fit
- [x] One cookie at a time, as big as fits, swiped or stepped with arrows (`CookieCarousel`, CSS scroll snap)
- [x] 1st/2nd/3rd medal buttons that say where each medal is (`MedalButtons`); medals in any order (`awardPlace`)
- [x] Next says how many medals are left; confetti when the last is given
- [x] The 🔍 zoom modal, the cookie grid and category swiping are gone (`CookieCard`, `CookieZoom`, `useSwipe`, `toggleRanking`)

## Phase 17 — Festive waiting room ✅

Owner feedback (2026-10-14): make the "waiting for results" screen fun and
festive; the old app had a dancing snowman. From five mocks (Artifact "Waiting
Room Mockups") the owner kept three, shown at random, plus the voter's picks
with photos and a way to change a category.

- [x] Dancing snowman, snow globe and cookie oven scenes (`WaitingScene`), one at random per visit; tapping makes them react, no hint
- [x] "Your picks" with cookie photos and medals (`PicksSummary`, `CookieThumb`)
- [x] Tap a category to change it, save, and come back (`WaitingRoom`, `CategoryStep`, `updateBallotCategory`)
- [x] Rules allow a ballot update by its owner while `voting`; results recompute on any ballot write (`onBallotWritten`)

---

## Owner actions

Things only the repo owner can do, in the existing `cookie-voting` project.
Step-by-step instructions are in [`SETUP.md`](./SETUP.md). None are needed
until real-device testing (useful from phase 3).

- [ ] Check the basics: Blaze still active, $1 budget alert, bucket location, Google + Anonymous sign-in enabled (SETUP.md §1)
- [ ] Clear out the previous attempt: old functions, Firestore data, photos (SETUP.md §2)
- [ ] Add your email to `admins/` (SETUP.md §3)
- [ ] Deploy credentials for GitHub Actions: a service account key as the `FIREBASE_SERVICE_ACCOUNT` secret (SETUP.md §4)
- [ ] GitHub Pages source set to "GitHub Actions" (SETUP.md §5)
- [ ] Delete the unused `FIREBASE_TOKEN` and `VITE_*` repository secrets (GitHub → Settings → Secrets and variables → Actions)
- [x] Storage service agent may read Firestore (SETUP.md §4e), done 2026-10-14
- [ ] Sentry secrets in Doppler, synced to GitHub (SETUP.md §6)
- [ ] App Check: reCAPTCHA key, `RECAPTCHA_SITE_KEY` in Doppler, then enforce on Cloud Firestore (SETUP.md §7)
- [ ] Dry run: create a small event, vote from two or three real phones, open results

---

## Session log

### Session 1 — 2026-09-30

- Chose the stack with the owner: Firebase Blaze + React/Vite/TS; in-browser
  tap-to-select for cookies; scoring in Cloud Functions. Rationale and rejected
  alternatives are in ARCHITECTURE.md.
- Shipped phases 0 and 1.
- Restored real plate photos from git history into `fixtures/plates/` (3–8
  cookies each, 12 MP, parchment on a tray). Some photos have hand-drawn numbers
  beside the cookies, and one cookie is covered in candy toppings, which is a
  tap-to-select edge case.
- Environment notes: TypeScript stays on 6.0 (the current Vite template
  default); the Go-based TS 7 compiler can be evaluated later. An npm
  `overrides` entry in the root `package.json` works around oxlint's optional
  `vite-plus` peer pinning an old `@vitest/browser-playwright`.
- Added a SessionStart hook (`.claude/hooks/session-start.sh`) for cloud
  sessions: runs `npm install` and exports `CHROMIUM_PATH`.
- The owner chose to **reuse the existing `cookie-voting` project**. Found in git
  history and on the live site: old functions in `us-west1`
  (`processCookieImage` calls Cloud Vision, plus three callables), old data in
  the same `events/` paths, bucket `cookie-voting.firebasestorage.app`.
  Documented the cleanup in `docs/SETUP.md`, and moved the deploy workflow from
  phase 10 into phase 2 so the owner can try each phase on a real phone.
- Owner asked for the old project to be cleaned up. The session has no
  Google Cloud credentials and reading production data was blocked by the
  permission policy, so **deletion is still pending** (SETUP.md §2). Before
  that, saved the 9 unique plate photos that weren't already fixtures from the
  bucket's public `shared/cookies/` folder: 2048 px, metadata and GPS
  stripped. They're catalogued in `fixtures/plates/README.md`, and the old
  category names are useful for seed data.
- **Next:** phase 2.

### Session 2 — 2026-10-07

- Planning only: checked every PRD requirement against `main` and wrote
  [`PRD-COVERAGE.md`](./PRD-COVERAGE.md), a prioritized checklist mapping each
  one to its phase.
- Added the gaps it found: bucket CORS (phase 2), dashboard controls while an
  event is live (phase 7), early-visit state for results (phase 9). Fixed the
  placeholder pages that named the wrong phases.
- Four product questions are open for the owner (PRD-COVERAGE.md → Open
  questions). Until answered, build their recommended defaults.
- **Next:** phase 2.

### Session 3 — 2026-10-07 (design system)

- Owner asked for a Christmas-themed design system that is easy to read and
  modern. Offered three directions (Classic cozy, Modern Nordic, Candy cane)
  and built on **Classic cozy**, the recommendation. Changing direction later
  is a `theme.css` + font import swap.
- Expanded tokens (subtle tints, `on-*` pairs, status, focus, shadows, snow
  animation) with WCAG contrast unit tests; self-hosted Fredoka + Nunito.
- New components with stories: Alert, Badge, Card, ProgressBar, RankBadge,
  Snowfall, Spinner, TextField; Button gained `danger`, `loading` and
  `fullWidth`. Storybook has a _Foundations_ page (colours, type, showcase)
  and autodocs pages. Details in ARCHITECTURE.md → Design system.
- Phase 2 is untouched; later phases should build on these components (e.g.
  RankBadge for phase 8, Snowfall for phase 10) rather than new one-offs.

### Session 4 — 2026-10-13 (phase 2)

- Owner answered the four open questions: free stepper; no locks on status
  changes or cookie edits after votes ("everything live updates, it's the
  admin's responsibility"); every category needs all 3 picks; removing an
  assigned baker is allowed. Recorded in PRD-COVERAGE.md → Owner decisions and
  ARCHITECTURE.md; phase 5 and 8 items updated to match.
- Shipped phase 2: rules + 20 rules tests, `recomputeResults` functions with
  emulator tests (triggers on ballots, setup, categories and status; snapshot
  guard so concurrent recomputes can't regress), web client + `useSubscription`
  hooks, seed script (`npm run seed`), E2E now runs on the seeded emulators, CI
  emulator job, and deploy/preview jobs gated on `FIREBASE_SERVICE_ACCOUNT`.
- Deviation: the web config isn't committed. Sessions can't reach
  cookie-voting.web.app through the egress proxy, so production loads
  `/__/firebase/init.json` from Hosting at startup instead.
- Seeded cookie boxes are a placeholder grid until phase 5 labels real ground
  truth.
- Cloud sessions must unset the proxy variables when starting emulators (see
  CLAUDE.md → Sandboxed / cloud sessions).
- The deploy jobs haven't run for real yet: they need the owner's secret
  (SETUP.md §4). The role list there is best-effort; check the first run.
- **Next:** phase 3.

### Session 4, continued — phase 3

- Shipped phase 3. Admin pages sit under an `AdminGate` layout route. Auth uses
  `initializeAuth` without the popup resolver (smaller voter bundle); Google
  sign-in passes `browserPopupRedirectResolver` to `signInWithPopup`. Popup,
  not redirect, because the auth domain (firebaseapp.com) differs from the
  site (web.app).
- E2E signs in through `window.signInForTests(email)`, defined only in
  emulator builds, which hands the auth emulator an unsigned Google token.
- Writes live in `apps/web/src/lib/mutations.ts`. Later steps show a
  "coming in phase N" card until built.
- Deploy credentials: the owner chose to have Claude set them up on his Mac via
  Remote Control and to delete the old project's leftovers. Track whether
  `FIREBASE_SERVICE_ACCOUNT` exists before relying on deploys.
- **Next:** phase 4.

### Session 4, continued — phase 4

- Shipped phase 4: the categories step (`pages/admin/steps/CategoriesStep.tsx`;
  the bakers step moved to `steps/BakersStep.tsx`), `CategoryNameForm`,
  `CategoryList` (dnd-kit, handle-only drag), `ConfirmDialog` (native
  `<dialog>`) and `CookieImage`. Storybook serves `fixtures/plates` at `/plates`.
- Fixed a phone bug from phase 3: screen-reader-only text inside the stepper's
  sideways scroller escaped it (absolute position, non-positioned scroller), so
  phones laid the setup page out 700 px wide and zoomed out. The stepper is now
  `relative`, and the categories E2E asserts the page doesn't scroll sideways.
- E2E reorders with the keyboard and waits on dnd-kit's live-region
  announcements between keys; without that, keys get dropped.
- **Next:** phase 5.

### Session 4, continued — phase 5

- Shipped phase 5: `PlateEditor` (pointer events: one finger draws, moves and
  resizes; two fingers pinch-zoom and pan; keyboard arrows, Shift + arrows,
  Delete; **Add cookie** button) and the Cookies step, which reuses `Stepper`
  as its category picker and keeps the open category in `?category=`. Geometry
  helpers (`clampBox`, `moveBox`, `resizeBox`, `iou`, `readingOrder`) are in
  `packages/shared/src/geometry.ts`.
- Ground truth: `fixtures/plates/*.json` holds hand-checked boxes for all 17
  photos (labelled from overlays rather than in the editor; edges within about
  1%, soft or shadowed edges and the two ~1000 px photos are the least sure).
  `firebase/scripts/plates.test.ts` checks counts, bounds and reading order, and
  the seed now uses these boxes instead of a grid.
- Phase 6 note: Hugging Face is blocked by this sandbox's egress proxy, but
  MediaPipe's `magic_touch.tflite` (6.2 MB, storage.googleapis.com) downloads.
  The SlimSAM half of the spike may need to run in CI or on the owner's machine.
- **Next:** phase 6.

### Session 4, continued — phase 6

- Shipped tap-to-select with MediaPipe `magic_touch`: 92 of 95 fixture cookies
  box at IoU ≥ 0.8 when the model sees a crop of 60% of the long edge around
  the tap (results table in ARCHITECTURE.md → Tap-to-select). The model file
  is committed and served from Hosting; `lib/cookieFinder/` holds the lazy
  loader, `useCookieFinder` and the tested mask-to-box logic.
- `PlateEditor` takes a `tapToSelect` prop (loading / ready / unavailable), so
  stories use a fake finder and the component stays model-free.
- E2E "tapping each cookie boxes it" taps the five candy canes on the real
  photo and checks every box against ground truth.
- The spike harness (static server + Playwright, tapping ground-truth centres)
  lived in the session scratchpad; rebuild it from the description in
  ARCHITECTURE.md if the model changes.
- **Next:** phase 7.

### Session 4, continued — phase 7

- Shipped the Assign bakers, Voting and Results steps and live dashboard rows.
  New components: `BakerPicker`, `SharePanel`, `QrCode`. `EventCard` takes
  children for the live controls under its link.
- Opening results from setup is allowed (Q2: any order); only Open voting is
  gated by the checklist.
- E2E "an admin assigns bakers, opens voting and then results" covers the
  gate, the picker, the share panel and Open results from the dashboard.
- **Next:** phase 8 (voter flow; Q3: every category needs all its picks).

### Session 4, continued — phase 8

- Shipped the voter flow at `/event/:id`: anonymous sign-in, landing, one
  category per screen with progress, Back/Next and swipe, review, submit.
  New components: `CookieCard`, `CookieZoom`, `CategoryBallot`, `BallotReview`.
- Next stays disabled until a category has all its picks (Q3). The grid uses
  2 columns up to 4 cookies, 3 up to 9 and 4 above that.
- Ballot writes live in `lib/ballots.ts` rather than `lib/mutations.ts` so the
  voter chunk doesn't pull in Storage.
- After submitting, the voter sees "Thanks for voting!" (also after a reload).
  When results open, the page moves to `/event/:id/results`. While results are
  open, people who haven't voted can still vote, and a banner links to the
  results.
- A second submit is rejected by the rules (tested in phase 2). The UI shows
  "already voted" if one gets through.
- E2E: a full vote across 6 categories with a change from review and a reload,
  swipe (mobile), voting not open, unknown event.
- **Owner check:** Anonymous sign-in must be enabled in Firebase Auth for
  production (SETUP.md §1).
- **Next:** phase 9 (results page).

### Session 4, continued — phase 9

- Shipped the results page at `/event/:id/results`: the overall "Top bakers"
  leaderboard first, then every category's cookies with crop, cookie number,
  baker and points. Ties share a place and say "Tied 2nd". It updates live.
- New components: `StandingRow` (shared by both tables), `CategoryResults`,
  `BakerLeaderboard` and `Confetti` (hidden under reduced motion).
- `useResults(null)` subscribes to nothing. The page only listens once the
  event's status is `results`, because before that the rules deny the read and
  a denied listener ends. Before then it shows "The results aren't out yet",
  plus a Go vote button while voting is open, and switches over by itself.
- E2E: a new ballot on bake-off-2024 adds 3/2/1 points to the picked cookies
  live (mobile project only, since it changes shared seed data), plus the
  "not out yet" and unknown-event states.
- **Next:** phase 10 (launch polish).

### Session 4, continued — phase 10

- The voting grid gets more columns from the `sm` breakpoint (4 / 5 / 6), so a
  whole plate fits on laptops, tablets and phones held sideways.
- The 404 page is a card with a clearer hint for mistyped voting links.
- New `e2e/voter-a11y.spec.ts` runs axe (WCAG 2.1 AA + best practice) and a
  no-sideways-scroll check on every voter screen at 375 px. `axe-core` is now
  a declared dev dependency (it was only there through the Storybook addon).
- Free-tier budget re-checked with real bundle sizes (see ARCHITECTURE.md).
- **Left:** App Check (owner's call) and the owner's dry run on real phones.

### Session 4, continued — phase 11 spike

- Measured an on-device "find all cookies" (grid of tap-to-select taps). It found
  86/95 cookies with ~3 wrong boxes per plate and took ~14 s per plate on a laptop.
  Tapping is quicker, so nothing shipped; numbers are in ARCHITECTURE.md.
- Every phase is now done. What's left is the owner's: App Check decision,
  Anonymous sign-in check, and a dry run on real phones (Owner actions).

### Session 4, continued — phase 12

- New owner requirement: phone-to-laptop handoff across devices and admins. Live
  sync already held (every admin screen listens to Firestore, and the URL carries
  the step and plate). Two gaps fixed: plate edits now merge in a transaction, and
  bulk upload turns each photo into a "Plate N" category.
- Seed data has a second admin, `elf@example.com`, for two-admin tests.
- The E2E can't make two saves truly race on the emulators; the merge itself is
  unit tested in `packages/shared/src/cookies.test.ts`.

### Session 5 — 2026-10-14 (owner feedback)

- Errors show in a sticky banner at the top of the page and go to Sentry
  (`lib/monitoring.ts`; off unless `VITE_SENTRY_DSN` is set). Step tabs wrap
  instead of scrolling on wider screens.
- Voters see "Thanks" only once the server has their ballot (`watchSavedDoc`).
- Category cards (owner feedback): the name is an auto-saving text field, a trash
  icon deletes, and "Add a category", "Rename" and "Replace photo" are gone.
  Categories come only from uploaded photos. `CategoryNameForm` was removed; the
  E2E helpers for this live in `e2e/categories.ts`.
- Wide screens (owner feedback): pages span the screen with side padding; text,
  forms and lists stop at a readable width; tab rows never wrap and scroll only
  when they don't fit. The rule is in CLAUDE.md → Conventions.
- Phase 13: admins page and request + approve (see above).
- CI: owner chose to keep every check blocking; story tests and E2E now run as
  separate parallel jobs.

### Session 5, continued — category photo cards (owner feedback)

- Owner picked the photo-card grid from three mocked layouts (bigger rows, photo
  cards, big photo beside the name list). Each category is a card with the plate
  photo across it and the name field below; one column on phones, two or three
  where the list has room (container queries, so it follows the column, not the
  window). Reordering uses dnd-kit's `rectSortingStrategy`; arrow keys move
  spatially, so on wide screens a card moves left/right.
- Hovering a plate photo with a mouse shows it up to 720 px wide beside the card
  (`PhotoZoom`, placement in `previewPlacement.ts`, kept inside the window);
  clicking or tapping opens the full photo in a dialog.
- E2E: reloads in `admin.spec.ts` go through `reloadWhenSaved` (waits on
  Firestore's pending writes via an emulator-only `window.writesSavedForTests`);
  a plain reload sometimes dropped a rename or reorder still in flight.
- Seen once locally under load, not fixed: "an admin boxes the cookies on a plate"
  can miss the box-resize width check (admin.spec.ts, the `second.boundingBox` poll).

### Session 5, continued — one Cookies step (owner feedback)

- Mocked two layouts (baker chips above the photo; baker list with thumbnails) across
  every state; built the chips (recommended). `AssignStep` and `BakerPicker` are gone;
  `SETUP_STEPS` no longer has `assign`, and `setupProgress` adds `boxed` for the
  Voting checklist. Old `?step=assign` links fall back to the opening step.
- Fixed the jump: with no `?category`, the step used to pick "the first plate with no
  cookies", which changed as soon as one was boxed. It now pins the opening plate.
- E2E: `admin.spec.ts` tags with the chips and reassigns through the menu;
  `handoff.spec.ts` reads the plate tabs as "Plates".
- Not done: type-to-filter in `BakerMenu` (it scrolls past ~6 bakers); add it if
  rosters get long. A plate counts as done once every boxed cookie has a baker,
  even if some cookies on it aren't boxed yet (the app can't tell).

### Session — 2026-10-14 (condense the Cookies step)

- Shipped the removals the owner asked for: `PlateEditor` is now just the photo.
  Drag-to-draw is gone: a tap adds a box to fit by hand when tap-to-select finds
  nothing, and dragging empty photo pans. Hints float over the photo. A
  focus-only Add cookie button keeps a keyboard way to add a box.
- Two rounds of mocks ("Cookies Step Header Mocks", then "Cookies Step
  Navigation Mocks"). The owner mixed them: event name in the red bar (D),
  prompt on the photo (C), photo fits the window (A), steps as a progress
  stepper (round 2, option 2) and plates as photo thumbnails (round 2, option 1).
  He found steps, plates and bakers sharing one chip style "a big mess", and
  didn't want Next plate in the plate row.
- `AppBarContent` portals page content into the red bar; `Stepper` is now the
  progress line (phones show only the current step's name); `PlateTabs` is new.
  At 1920 × 960 the photo is 596 px tall and nothing scrolls; at 375 px the
  whole step fits in 740 px.

### Session — 2026-10-14 (festive Spotlight ballot)

- Four mock directions (gallery, spotlight, tap-the-plate, feed); the owner
  picked Spotlight for its photo size and found the first version's voting
  "clunky". Round two moved the thumbnails above the photo, added finger
  swiping, and tried two kinds of vote buttons; the owner chose three medal buttons
  whose text updates ("Not given yet", "Now on #2", "Tap to take back").
  Round three dropped the line under the photo and kept medals from being
  clipped; round four centred the laptop thumbnails on their own row.
- Medals are now places, not an ordered list: `CategoryPlaces` has a slot per
  medal with gaps until all are given (`awardPlace`, `allPlacesGiven`). The
  ballot sent is unchanged.
- The page fills the window: at 375 × 740, 1366 × 680 and 1920 × 960 nothing
  scrolls (screenshots in the project's `screenshots/spotlight-ballot`).
- Swiping now moves between cookies, so swiping between categories is gone;
  Back and Next do that. Phones show an icon-only Back so long category names fit.
- Notes for next time: the carousel ignores the cookies it passes while the
  arrows or thumbnails scroll it (`target` in `CookieCarousel`); without that a
  smooth scroll reported cookies on the way and undid the move.

### Session — 2026-10-14 (festive waiting room)

- Five clickable mocks (snowman, snow globe, oven, gingerbread dance party,
  catch-the-cookies game); the owner kept the first three, shown at random and
  re-picked on refresh, and dropped the "Tap Frosty" hint so the reactions are
  a surprise.
- Voters can now change a category after sending their ballot, until results
  open: rules allow an update while `voting`, keeping `submittedAt` and setting
  `updatedAt`. `onBallotCreated` became `onBallotWritten` (the CI deploy's
  `--force` removes the old function).
- The category screen moved out of `BallotFlow` into `CategoryStep` so the
  ballot and the waiting room share it. `BallotReview` now says votes can be
  changed until results open.
- Scene animations are theme keyframes (`--animate-snowman-*`, `globe-shake`,
  `oven-*`, …) plus four illustration colours (`carrot`, `dough`,
  `gingerbread`, `gingerbread-shade`). The snow globe's flakes are a small
  requestAnimationFrame loop that stops once the snow settles.
- Notes for next time: the voter a11y E2E can catch the carousel's swipe hint
  mid-fade (`color-contrast: .bottom-5`); it passed on the re-run.

### Session — 2026-10-14 (shuffle cookies per voter)

- Each voter sees every category's cookies in their own order: `stableShuffle`
  in `packages/shared`, applied in `VoterEventPage` so the ballot, review and
  waiting room all agree. Seeded by uid + category id, so it's stable across
  reloads and edits from the waiting room; ordered by a hash of each cookie id,
  so admin edits mid-vote don't reshuffle.
- Voter numbers `#1…#n` follow the shuffled order, so they don't match the
  results page's plate numbers. The results E2E now checks a category's total
  points (+6) instead of specific cookies.

### Session — 2026-10-14 (no cookie numbers for voters or results)

- Owner: "not even bother numbering the cookies". The big photo's `#n` badge
  and the results' "Cookie #n" subtitle are gone; medal buttons say "On another
  cookie" instead of "Now on #2" (owner picked this over a tiny photo).
- Screen-reader labels ("Show cookie 3", "Cookie 3") stay, by position on the
  voter's screen, so E2E selectors are unchanged. Admin plate editor keeps its
  numbers.

### Session — 2026-10-14 (no flash after changing a category)

- Bug: "Save my picks" in the waiting room flashed the ballot's start page.
  `watchSavedDoc` reported the ballot as missing while the change was a pending
  write, so `VoterEventPage` briefly showed `BallotFlow`. It now keeps the last
  server-accepted version during a pending write (still `null` for a ballot
  that's never been accepted, so "Thanks" still waits for the first send).
- The waiting-room E2E watches the DOM while saving and fails if "Start voting"
  appears at all.

### Session — 2026-10-14 (festive results: ornaments)

- Owner picked "Ornaments" from three mocks (artifact "Ornament Results Mockup"):
  one slide per category, top three hanging from a garland, swipe or tap a
  category; then Top bakers; then All results, one scrolling list replacing the
  per-category "See all" idea.
- Timed reveal (owner: no tapping to open, about 5 s): drop on unrolling strings
  hooked onto the garland, then 3rd, 2nd, 1st with drumrolls, confetti for the
  winner. Plays once per slide; leaving or Skip opens it; reduced motion starts open.
- Tapping an open ornament or a row in All results shows the cookie's votes. The
  tally now stores `votes` per cookie and `ballotCount` per category.
- E2E: the ornaments sway forever, so specs switch on reduced motion
  (`page.emulateMedia`) before clicking one.
- Deferred to its own thread ("Bakers list on results"): All results' baker card
  listing every baker, tapping one to list their cookies and points.

### Session — 2026-10-14 (bakers on All results)

- Owner approved the mock "Baker Results Mockup" (option B, with the points bar).
  All results now opens with the **Bakers** card (renamed from "Every baker"): each
  baker's best cookie, rank, cookie count and total. Tapping a baker, or their Top
  bakers ornament, opens `BakerBreakdown`: their cookies best first with category,
  place and points, under a points bar split per cookie.
- The bar is interactive (owner asked for it to be delightful): hovering or tapping a
  piece grows it, fades the rest, shows a bubble with the category, points and share,
  and lights up the row, whose colour dot springs open into a glowing side strip.
  Hovering a row lights up its piece.
- A cookie row opens its `VoteBreakdown` on top of the baker's pop-up (both are native
  modal dialogs, so they stack). Results from before vote counts were kept show the
  rows without buttons.
- New shared helper `bakerCookies`; `Ornaments`/`RevealSlide` take a `selectHint` so
  the Top bakers slide says "Tap a baker to see their cookies".

### Session — 2026-10-15 (cookie loading spinner)

- Owner reported spinners sitting in the top-left corner and asked for a festive one.
  Cause: `Spinner` was an inline element, so the pages' `mx-auto mt-12` did nothing.
- Four options mocked up ("Cookie Spinner Options" artifact); built **Nom nom**: bites
  are masked out of a chocolate-chip cookie one by one, crumbs fall, it pops back whole.
  Under reduced motion it's a still cookie with one bite.
- `Spinner` gained `layout`: `inline` (buttons, hints), `section` (centred in its
  container, label shown) and `screen` (centred in the screen under the app bar).
  Every loading state uses it, including the pre-route `LoadingScreen` (was a bouncing
  emoji). New `nom-*` keyframes in theme.css.

### Session — 2026-10-15 (late voters see their picks first)

- Owner asked for stragglers to vote after results open; that already worked (rules
  accept ballots in `results`, the ballot shows a "Results are open" banner). The ask
  that remained: a late voter lands on a summary with a **View results** button
  instead of jumping straight to the results.
- `VoterEventPage` remembers a ballot sent during `results` in this visit and shows
  `WaitingRoom`, which in `results` says "Thanks for voting!", links to the results
  and shows `PicksSummary` read-only (`onEdit` is now optional). Earlier voters still
  move on to the results by themselves; a reload goes straight to the results.
- Results page: someone with no ballot sees a gold "Haven't voted yet? Vote now" link
  under the heading (owner said yes). It calls `useVoter`, so visiting the results
  link signs a browser in anonymously, like the voting link does.
- E2E: the late-vote test in `results.spec.ts` now starts from Vote now, goes through
  the summary, and checks the link is gone once they've voted.

### Session — 2026-10-15 (cookie arrow buttons)

- Ballot carousel arrows: the `‹`/`›` text glyphs sat low and left in the circle, so
  they're now an SVG chevron on a 24×24 grid, centred by construction. They tint to
  `primary-subtle` on hover and shrink a little when pressed.
- App-wide: Tailwind v4 dropped `cursor: pointer` on buttons, so a base rule in
  `index.css` puts the hand back on every enabled `button` and `[role=button]`.
- Story `CookieCarousel/ArrowIsCentred` checks the chevron's centre against the
  button's and the pointer cursor.

### Session — 2026-10-15 (stale chunks after a deploy)

- Bug: a voting tab opened before a deploy showed React Router's "Unexpected Application
  Error! Failed to fetch dynamically imported module …AdminHomePage-….js" when the app
  title was tapped, because that build's chunk was gone from Hosting.
- Lazy routes now reload the page once on a chunk-load error (`lib/staleChunk.ts`);
  other page errors get a friendly "Oh, crumbs!" card (`RouteErrorPage`) instead of the
  developer screen. Hosting sends `no-cache` for everything but hashed assets.
- The app title on voter pages (`/event/:id/…`) now goes back to that event instead of
  the admin sign-in at `/`.
- Unit tests now unmount between tests (`afterEach(cleanup)` in `src/test/setup.ts`);
  before, renders piled up in one document.
- Considered making missing `/assets/**` return a real 404 (`"source": "!/assets/**"`
  on the SPA rewrite works in the emulator) but left it: if production Hosting read the
  glob differently, every voter link would 404. The reload handles both cases.

### Session — 2026-10-15 (alignment audit)

- Owner spotted the voting page's event name sitting off the "Cookie Voting" baseline
  and asked for an audit. Screenshotted every page at 375, 1024 and 1500 px and fixed:
  - App bar: items share a baseline; one `AppBarTitle` (› + name, one style) replaces
    three hand-styled titles.
  - `Button`: labels that wrap stay centred and balanced.
  - Ballot: the Next button is as tall as the medal buttons.
  - `EventCard` badge on the title's baseline; `Stepper`'s first circle on the column
    edge; baker/admin list rows have even insets.
  - `ConfirmDialog` renders into `<body>`: a closed dialog at the end of a `space-y`
    card gave the Results and Voting steps a doubled bottom gap.
  - Results ornaments keep 72 px for the 1st-place tag, which overlapped the slide
    dots on short phones.
- Added an alignment checklist to CLAUDE.md → Conventions.
- Owner rejected three proposed changes as intentional spacing: narrowing the app bar
  to the voter column, pulling ghost buttons ("Sign out", ballot Back) flush with the
  edge, and centring category-card controls on the name field alone. Reverted.

### Session — 2026-10-15 (feedback button)

- Owner asked for a way to leave feedback or report a bug with screenshots. Picked
  Sentry's feedback widget (already used for errors) with session replay for phones,
  where Sentry offers no screenshots; no GitHub issue copying. See ARCHITECTURE.md →
  Errors → Feedback.
- 💬 _Feedback_ in the app bar (`FeedbackButton`, icon only under 640 px), only in
  deploy builds. Form and replay load lazily from Sentry's CDN.
- To read reports: Sentry connector, org `tytaniumdev`, project `cookie-voting`,
  query `issue.category:feedback`; a report links its replay.

### Session — 2026-10-15 (bot protection)

- Owner asked whether bots could flood the voting link. Today a script can mint
  anonymous accounts and cast one ballot each; the only brake is Firebase Auth's default
  sign-up limit of about 100 new accounts per IP per hour.
- Added App Check with invisible reCAPTCHA Enterprise (`lib/firebase.ts`), on in
  production and preview builds when the `RECAPTCHA_SITE_KEY` secret exists; never on
  the emulators. Enforcement is the owner's console switch (SETUP.md §7), Firestore
  only: photos load as plain download URLs that would fail under Storage enforcement.
- Considered and not built: an admin tool to void a burst of suspicious ballots.
  Revisit if bogus votes ever get through.

### Session — 2026-10-15 (link previews)

- Owner asked for nicer cards when sharing links in
  iMessage and Signal (they showed a bare title and a compass icon). Added Open Graph +
  Twitter tags, a festive 1200×630 card image, an apple-touch-icon and a drawn cookie
  favicon (the emoji favicon didn't render for crawlers). Images come from
  `apps/web/scripts/render-share-images.mjs`. Per-event cards deferred (see
  ARCHITECTURE.md → Design system). iMessage caches previews per link, so a link shared
  before this deploy may keep its old card on that phone.

### Session — 2026-10-15 (stuck on submitting)

- Two iPhone voters reported (Sentry feedback) the ballot stuck on "Submit my votes" and
  the results stuck loading. Cause: the page moved on only when the ballot listener saw
  the ballot as saved, and Firestore counts a write as saved only once the listen
  connection catches up as well as the write's own answer. A stalled listen connection
  (phones, iOS especially) left the spinner forever with no error. Reproduced in E2E by
  holding every listen request; now the submit moves on when the write is accepted, and
  saved category changes show straight away.
- Anything still sending or loading after 10 s shows a "Still sending/loading" notice
  with Try again (reconnects Firestore) or Reload, and sends a Sentry warning
  (`Still waiting: …`), so stalls are visible and counted. Check those warnings
  if reports continue; forcing long polling (`experimentalForceLongPolling`) is the next
  lever if stalls turn out to be common.
- Not App Check: the builds the reports came from didn't initialise it, and it
  wasn't enforced.

### Session — 2026-10-15 (results on phones)

- Sentry feedback (COOKIE-VOTING-3, iPhone): the winner's tag was cut off by the slide
  dots under the results. Owner agreed: removed the dots from `SlideShow`. The tab row
  above (which scrolls, with the next tab peeking at the edge), swiping and the arrows
  on wider screens still show there are more slides.
- Also fixed on phones: the 3rd-place tag sat under the 1st-place ornament's cap and
  crown. The tall ornament layout now hangs 1st below the side tags (`SIDE_TAG_HEIGHT`,
  reserved in px like `TAG_HEIGHT`), shrinking the balls on short screens to fit.
- Owner noticed the results slides could be panned freely on a phone, which fought
  swipes and pull-to-refresh: the slide track scrolled up and down by the 12 px the
  ornaments' swing overflowed. Every sideways scroller (`SlideShow`, `CookieCarousel`,
  tab and chip rows) now sets `overflow-y-hidden`; rule added to CLAUDE.md.
