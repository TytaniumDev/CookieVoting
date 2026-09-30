# Roadmap

The build is split into phases, each sized for one agent session. Work top to
bottom: a phase starts only when the ones before it are done, unless it says
otherwise. Design context lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md);
product requirements in [`../ClaudePRD.md`](../ClaudePRD.md).

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

## Phase 2 — Firebase backend foundation ⬜

Build and test everything against the emulators with the `demo-cookie-voting`
project ID. Production is the existing `cookie-voting` project (see
ARCHITECTURE.md → Firebase project and environments, and `docs/SETUP.md`).

- [ ] `firebase.json`, `.firebaserc` (default project `cookie-voting`), emulator config (auth, firestore, storage, functions, hosting); emulator scripts pass `--project demo-cookie-voting`
- [ ] `firebase/firestore.rules` + `firebase/storage.rules` per ARCHITECTURE.md → Security model
- [ ] Rules unit tests with `@firebase/rules-unit-testing` (admin vs voter vs anonymous; ballot create-once; results visibility by status)
- [ ] `functions/` workspace (region `us-west1`): 2nd-gen triggers calling `recomputeResults(eventId)` → `tallyResults`; bundled with esbuild so `@cookie-voting/shared` is inlined
- [ ] Function integration tests on the emulator (ballot → results doc; assignment change → recompute; concurrent ballots don't regress `ballotCount`)
- [ ] `apps/web/src/lib/firebase.ts`: typed client init with the committed public web config for `cookie-voting` (from `https://cookie-voting.web.app/__/firebase/init.json`); auto-connect to emulators in dev/test
- [ ] Typed Firestore converters/hooks layer (`useEvent`, `useCategories`, …) with listener cleanup
- [ ] Seed script: an event with categories using `fixtures/plates` photos, bakers, assignments, ballots
- [ ] CI job running rules + functions tests under `firebase emulators:exec`
- [ ] If the emulators download large files on first run, pre-fetch them in `.claude/hooks/session-start.sh` so cloud sessions stay fast
- [ ] Deploy workflow: on `main`, deploy Firestore/Storage rules, indexes, functions (`--force`, which also removes leftover legacy functions) and hosting to `cookie-voting`; hosting preview channel per PR. Skip cleanly while the deploy secret isn't configured. If phase 2 runs long, this item can move to phase 3
- [ ] Replace `docs/SETUP.md` section 4 with the exact deploy-credential steps (service account roles + GitHub secret)

**Done when:** `npm run test:emulators` passes locally and in CI; the web app can read seeded data from the emulators.

## Phase 3 — Admin sign-in, dashboard, events, bakers ⬜

- [ ] Google sign-in; allowlist check against `admins/{email}`; friendly "not an admin" state
- [ ] Route guard for `/admin/**` and the dashboard at `/`
- [ ] Dashboard: event list (name, status, created date, current setup step) → event page
- [ ] Create event (`/admin/events/new`)
- [ ] Event setup page with a stepper whose steps are **derived from data** (bakers added → categories → cookies identified → bakers assigned → voting → results), each step reachable
- [ ] Bakers step: event roster from the global list (type-to-search), create new baker (saved globally + added), remove from event
- [ ] Stories for every new component; E2E: admin signs in (auth emulator), creates an event, adds bakers

## Phase 4 — Categories & plate photos ⬜

- [ ] Add / rename / delete categories (delete blocked once ballots exist)
- [ ] Name suggestions ranked by frequency of use across past events
- [ ] Drag-to-reorder that works with touch (e.g. dnd-kit), persisting `order`
- [ ] Photo capture/upload from phone camera or gallery: EXIF-aware decode, downscale to 2048 px, JPEG 0.85, upload with progress, replace photo
- [ ] `CookieImage` component: renders a cookie from plate photo + normalised box (ARCHITECTURE.md → Rendering a cookie)
- [ ] Stories + E2E (upload a fixture photo on the mobile profile)

## Phase 5 — Plate editor (manual, mobile-first) ⬜

- [ ] Photo with box overlay; pinch-zoom and pan on phones
- [ ] Draw box by dragging; select; move; resize via handles sized for fingers; delete
- [ ] Save sorts cookies into reading order; show numbers `#1…#n`
- [ ] Editing cookies locked once voting opens (assignments stay editable)
- [ ] Use the editor to label ground truth for every `fixtures/plates/*.jpg` → `fixtures/plates/*.json` (boxes), for measuring detection in phases 6 and 11
- [ ] Geometry helpers in `packages/shared` (clamp, normalise, reading order, IoU) with unit tests
- [ ] Stories + E2E on the mobile profile (draw, resize, delete)

## Phase 6 — Tap-to-select ⬜

- [ ] Spike: MediaPipe Interactive Segmenter (`magic_touch`) vs SlimSAM (Transformers.js). Tap each ground-truth cookie centre in `fixtures/plates`, then measure box IoU, model download size, first-tap latency and per-tap latency. Record results in ARCHITECTURE.md
- [ ] Watch for cookies with toppings (e.g. candies on a cookie): a tap may select only the topping. Prefer the mask that best matches a whole cookie (multi-mask output / largest plausible region)
- [ ] Integrate the winner as a lazy-loaded, admin-only module; tap a cookie → box added; tap a box → select it
- [ ] Graceful fallback to manual drawing if the model fails to load (old phone, offline)
- [ ] E2E on fixture photos: tapping centres yields boxes with IoU ≥ 0.8 against ground truth

## Phase 7 — Baker assignment & opening voting ⬜

- [ ] Per category: cookie crops with a type-to-filter baker picker (no pre-selection of the previous baker)
- [ ] Validation gating: every category has a photo and ≥ 1 cookie, every cookie has a baker
- [ ] Open voting → share panel with the voter URL, copy button and QR code
- [ ] Live ballot count on the dashboard (from `results/live.ballotCount`)
- [ ] Open results button

## Phase 8 — Voter flow ⬜

- [ ] Anonymous sign-in on load; "already voted" detection → waiting/results
- [ ] Landing: event name, ordered category list, "Start voting"
- [ ] One category at a time, progress indicator, forward/back + swipe
- [ ] Adaptive grid that fits all cookies on screen where possible; tap to rank (badges 1/2/3), tap again to unrank with renumbering (`toggleRanking`); 🔍 zoom modal
- [ ] Review screen → submit (create-once ballot) → waiting screen that follows event status live
- [ ] Voting closed / event not found states
- [ ] Stories + E2E: full vote on the mobile profile against the emulators, double-submit rejected

## Phase 9 — Results ⬜

- [ ] `/event/:eventId/results` and in-flow results from `results/live` (live listener)
- [ ] Per-category rankings with tied ranks, crop, baker name, points
- [ ] Overall baker leaderboard with ties
- [ ] Celebration moment (confetti or similar, respecting `prefers-reduced-motion`)
- [ ] E2E: votes → results reflect Borda scores

## Phase 10 — Launch ⬜

- [ ] Festive polish: subtle snow animation (reduced-motion aware), imagery, empty states, copy
- [ ] Accessibility and 375 px layout pass on every voter screen
- [ ] Production check of the deploy workflow; remove the old `FIREBASE_TOKEN` / `VITE_*` GitHub secrets
- [ ] App Check (reCAPTCHA Enterprise) on Firestore/Storage (and AI Logic if phase 11 ships)
- [ ] Owner walkthrough in `docs/SETUP.md` verified end to end; dry-run event on real phones

## Phase 11 — Optional: pre-outline all cookies ⬜

Can start any time after phase 5 (it needs the ground truth).

- [ ] Spike: Gemini Flash via Firebase AI Logic (Gemini Developer API free tier, JSON boxes) vs in-browser SAM "segment everything" grid. Score against `fixtures/plates/*.json`
- [ ] If one reliably reaches ≥ 90% of cookies at IoU ≥ 0.8: "Find cookies" button whose results are editable suggestions
- [ ] Note the free-tier caveats (quota changes; free-tier prompts may be used by Google) in ARCHITECTURE.md

---

## Owner actions

Things only the repo owner can do, in the existing `cookie-voting` project.
Step-by-step instructions are in [`SETUP.md`](./SETUP.md). None are needed
until real-device testing (useful from phase 3).

- [ ] Check the basics: Blaze still active, $1 budget alert, bucket location, Google + Anonymous sign-in enabled (SETUP.md §1)
- [ ] Clear out the previous attempt: old functions, Firestore data, photos (SETUP.md §2)
- [ ] Add your email to `admins/` (SETUP.md §3)
- [ ] Deploy credentials for GitHub Actions, once phase 2 documents them (SETUP.md §4)
- [ ] GitHub Pages source set to "GitHub Actions" (SETUP.md §5)

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
