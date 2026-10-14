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
- [x] Photo capture/upload from phone camera or gallery: EXIF-aware decode, downscale to 2048 px, JPEG 0.85, upload with progress, replace photo
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
- [ ] App Check (reCAPTCHA Enterprise) on Firestore/Storage: waiting on the owner's call
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
