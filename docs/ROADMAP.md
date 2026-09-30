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

Everything runs against the emulators with the `demo-cookie-voting` project ID,
so no real Firebase project is needed yet.

- [ ] `firebase.json`, `.firebaserc`, emulator config (auth, firestore, storage, functions, hosting)
- [ ] `firebase/firestore.rules` + `firebase/storage.rules` per ARCHITECTURE.md → Security model
- [ ] Rules unit tests with `@firebase/rules-unit-testing` (admin vs voter vs anonymous; ballot create-once; results visibility by status)
- [ ] `functions/` workspace: 2nd-gen triggers calling `recomputeResults(eventId)` → `tallyResults`; bundled with esbuild so `@cookie-voting/shared` is inlined
- [ ] Function integration tests on the emulator (ballot → results doc; assignment change → recompute; concurrent ballots don't regress `ballotCount`)
- [ ] `apps/web/src/lib/firebase.ts`: typed client init from env/config, auto-connect to emulators in dev/test
- [ ] Typed Firestore converters/hooks layer (`useEvent`, `useCategories`, …) with listener cleanup
- [ ] Seed script: an event with categories using `fixtures/plates` photos, bakers, assignments, ballots
- [ ] CI job running rules + functions tests under `firebase emulators:exec`
- [ ] `docs/SETUP.md`: owner checklist for the real project (see "Owner actions" below)

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
- [ ] Firebase Hosting deploy workflow on `main` + PR preview channels
- [ ] App Check (reCAPTCHA Enterprise) on Firestore/Storage (and AI Logic if phase 11 ships)
- [ ] Owner walkthrough in `docs/SETUP.md` verified end to end; dry-run event on real phones

## Phase 11 — Optional: pre-outline all cookies ⬜

Can start any time after phase 5 (it needs the ground truth).

- [ ] Spike: Gemini Flash via Firebase AI Logic (Gemini Developer API free tier, JSON boxes) vs in-browser SAM "segment everything" grid. Score against `fixtures/plates/*.json`
- [ ] If one reliably reaches ≥ 90% of cookies at IoU ≥ 0.8: "Find cookies" button whose results are editable suggestions
- [ ] Note the free-tier caveats (quota changes; free-tier prompts may be used by Google) in ARCHITECTURE.md

---

## Owner actions

Things only the repo owner can do. None are needed until real-device testing
(useful from phase 3) or launch (phase 10). Phase 2 writes the detailed steps
to `docs/SETUP.md`.

- [ ] Create a **new** Firebase project (the old `cookie-voting` project still has the previous attempt's functions and data), or confirm reusing it after cleanup
- [ ] Upgrade to Blaze; add a budget alert (e.g. $1)
- [ ] Create Firestore and a Storage bucket in a US free-tier region (us-west1, us-central1 or us-east1)
- [ ] Enable Auth providers: Google, Anonymous
- [ ] Add your email to `admins/`
- [ ] Add the deploy service-account secret to GitHub (`firebase init hosting:github` does this)
- [ ] Enable GitHub Pages with source "GitHub Actions" (for Storybook)

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
- **Next:** phase 2.
