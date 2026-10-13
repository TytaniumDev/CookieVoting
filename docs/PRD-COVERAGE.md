# PRD coverage

Every requirement in [`ClaudePRD.md`](../ClaudePRD.md), what exists on `main`,
and where the rest gets built. Remaining work is listed in build priority, which
is the phase order in [`ROADMAP.md`](./ROADMAP.md).

- **ROADMAP.md is the work queue.** Agents tick boxes there, not here. This file
  is the cross-check that nothing in the PRD falls through the cracks.
- **ARCHITECTURE.md wins** where it deliberately changes the PRD (see its
  _Deviations from the PRD_ table). Those rows say "changed" below.
- **Keep it current:** when a phase ships, flip its rows to ✅. When the PRD or a
  decision changes, add or edit rows.

Status: ✅ built on `main` · ⬜ planned (roadmap phase) · 🔁 changed by ARCHITECTURE.md · ❓ needs an owner decision

_Last checked against `main` at the phase 1 baseline (PR #30), 2026-10-07._

## Snapshot

Built so far (phase 1): the app shell with every PRD route as a lazy placeholder
page, the festive design tokens, Borda scoring with tied ranks and the
tap-to-rank ballot rules in `packages/shared` (unit tested), Storybook with
story tests, Playwright smoke tests, and CI that publishes Storybook to GitHub
Pages.

Not built yet: everything that touches Firebase (auth, data, rules, functions,
deploys) and every real screen. Nothing in the PRD is unplanned; the gaps this
review found were small and have been added to ROADMAP.md (see
[Gaps found](#gaps-found-in-this-review)).

## Prioritized checklist

### P1 — Backend foundation (roadmap phase 2)

Everything else reads or writes Firebase, so this comes first.

| PRD | Requirement                                                               | Status                                                 |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| §12 | `admins` readable for the allowlist check, writable only by admins        | ⬜ 2                                                   |
| §12 | `bakers` admin-only                                                       | ⬜ 2                                                   |
| §12 | Events and categories public read, admin write                            | ⬜ 2                                                   |
| §12 | Ballot create-once when `auth.uid == userId`, no update/delete            | ⬜ 2                                                   |
| §5  | Data model (events, categories, cookies, ballots)                         | 🔁 ballots private, roster and assignments hidden      |
| §8  | Borda 3/2/1 per category, baker totals across categories (0 where absent) | ✅ `tallyResults` · ⬜ 2 Cloud Function writes results |
| §9  | Results update live as votes arrive                                       | ⬜ 2 (recompute on ballot) + 9 (listener)              |
| §14 | Listeners unsubscribed on unmount                                         | ⬜ 2 (hooks layer)                                     |
| §3  | Firebase Auth, Firestore, Storage, Functions                              | ⬜ 2 · 🔁 Firebase Hosting instead of Vercel           |
| §14 | Free tier at <200 voters, <20 categories, <50 cookies                     | ✅ budgeted in ARCHITECTURE.md · ⬜ 10 verify          |
| —   | Bucket CORS so the in-browser model can read uploaded photos              | ⬜ 2 (added in this review)                            |

### P2 — Admin sign-in, dashboard, events, bakers (phase 3)

| PRD  | Requirement                                                  | Status                             |
| ---- | ------------------------------------------------------------ | ---------------------------------- |
| §4.1 | Google sign-in; only allowlisted emails get admin access     | ⬜ 3                               |
| §10  | Dashboard lists events (name, status, created date)          | ⬜ 3                               |
| §10  | Dashboard shows each in-progress event's current step        | ⬜ 3                               |
| §6.1 | Create event with a name, status `setup`                     | ⬜ 3                               |
| §6   | Stepper / progress indicator for the admin flow              | ⬜ 3 · ❓ Q1 (linear vs free)      |
| §6.2 | Event baker list; search the global roster and add           | ⬜ 3                               |
| §6.2 | Create a new baker (saved globally and added to the event)   | ⬜ 3                               |
| §6.2 | Remove a baker from the event without deleting them globally | ⬜ 3 · ❓ Q4 (if already assigned) |
| §6.2 | Skip the bakers step and come back later                     | ⬜ 3                               |
| §13  | E2E: admin creates an event                                  | ⬜ 3                               |

### P3 — Categories and plate photos (phase 4)

| PRD  | Requirement                                            | Status                                    |
| ---- | ------------------------------------------------------ | ----------------------------------------- |
| §6.3 | Add categories by name                                 | ⬜ 4                                      |
| §6.3 | Name suggestions from past events, ranked by frequency | ⬜ 4                                      |
| §6.3 | Upload a JPEG/PNG plate photo to Storage               | ⬜ 4                                      |
| §6.3 | Compress photos over 5 MB                              | 🔁 always downscale to 2048 px, JPEG 0.85 |
| §6.3 | Drag-and-drop reorder, persisting `order`              | ⬜ 4 (touch-friendly)                     |
| §6.3 | Delete a category only while no votes exist            | ⬜ 4                                      |
| §14  | Cropped images stored as JPEG ~85%                     | 🔁 crops rendered from photo + box        |

### P4 — Identifying cookies (phases 5, 6, optional 11)

| PRD  | Requirement                                                 | Status                                                 |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------ |
| §6.4 | "Run Detection" per category via Gemini in a Cloud Function | 🔁 in-browser tap-to-select (6); "find all" spike (11) |
| §6.4 | `detectionStatus` pending/running/complete/error            | 🔁 not needed without server detection                 |
| §6.4 | Plate photo with boxes overlaid                             | ⬜ 5                                                   |
| §6.4 | Delete a wrong cookie                                       | ⬜ 5                                                   |
| §6.4 | Add a cookie by drag-selecting a rectangle                  | ⬜ 5                                                   |
| §6.4 | Merge two cookies                                           | 🔁 dropped; move/resize boxes instead (5)              |
| §6.4 | Rectangles only, no polygons                                | ⬜ 5                                                   |

### P5 — Baker assignment and opening voting (phase 7)

| PRD  | Requirement                                                               | Status                      |
| ---- | ------------------------------------------------------------------------- | --------------------------- |
| §6.5 | Each cookie crop gets a type-to-filter baker picker from the event roster | ⬜ 7                        |
| §6.5 | Previous baker not pre-selected                                           | ⬜ 7                        |
| §6.5 | Every cookie must have a baker before voting opens                        | ⬜ 7                        |
| §6.6 | "Open Voting" sets status `voting` and shows the voter URL                | ⬜ 7                        |
| §6.6 | Live count of submissions                                                 | ⬜ 7                        |
| §6.7 | "Open Results" sets status `results`; voting continues after              | ⬜ 7 (rules allow it in 2)  |
| §10  | The **dashboard** itself shows count, URL and "Open Results" while live   | ⬜ 7 (added in this review) |
| —    | Moving an event backwards (reopen setup, hide results)                    | ❓ Q2                       |

### P6 — Voter flow (phase 8)

| PRD  | Requirement                                                       | Status                          |
| ---- | ----------------------------------------------------------------- | ------------------------------- |
| §4.2 | Anonymous sign-in on load; one ballot per anonymous user          | ⬜ 8 (rules in 2)               |
| §7.1 | Landing: event name, ordered categories, "Start Voting"           | ⬜ 8                            |
| §7.1 | Already voted → waiting or results by status                      | ⬜ 8                            |
| §7.2 | One category at a time, "Category 2 of 5", back/forward and swipe | ⬜ 8                            |
| §7.2 | Grid that fits all cookies on screen where possible               | ⬜ 8                            |
| §7.2 | 🔍 on each card opens a zoom modal                                | ⬜ 8                            |
| §7.2 | Tap to rank 1/2/3 with badges; tap again to unrank and renumber   | ✅ `toggleRanking` · ⬜ 8 UI    |
| §7.2 | Fewer than 3 cookies → fewer picks                                | ✅ `maxPicksFor` · ⬜ 8 UI      |
| §7.2 | Selections kept in memory across categories until submit          | ⬜ 8                            |
| §7.3 | Review screen, then submit; duplicate submit rejected             | ⬜ 8 · ❓ Q3 (empty categories) |
| §7.4 | Waiting screen that jumps to results when status changes          | ⬜ 8                            |
| §13  | E2E: voter submits a vote                                         | ⬜ 8                            |

### P7 — Results (phase 9)

| PRD | Requirement                                                                   | Status                       |
| --- | ----------------------------------------------------------------------------- | ---------------------------- |
| §9  | Results at `/event/:id` once status is `results`, and at `/event/:id/results` | ⬜ 9 (route placeholders ✅) |
| §9  | Per category: rank, crop, baker name, score; ties share a rank                | ✅ ranking logic · ⬜ 9 UI   |
| §9  | Overall baker leaderboard with ties                                           | ✅ ranking logic · ⬜ 9 UI   |
| —   | `/results` visited before results open shows a friendly "not yet" state       | ⬜ 9 (added in this review)  |

### P8 — Launch polish (phase 10)

| PRD | Requirement                                              | Status                             |
| --- | -------------------------------------------------------- | ---------------------------------- |
| §14 | Christmas palette defined centrally so it can be swapped | ✅ `theme.css`                     |
| §14 | Subtle snow animation, festive imagery                   | ⬜ 10                              |
| §14 | Every voter screen usable at 375 px                      | ⬜ built per phase · 10 final pass |
| §1  | Desktop responsive                                       | ⬜ 10                              |

### Already done

| PRD | Requirement                                                                                       | Status                                     |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| §11 | URL structure (`/`, `/admin/events/new`, `/admin/events/:id`, `/event/:id`, `/event/:id/results`) | ✅ lazy routes with placeholders           |
| §13 | Small reusable components with Storybook stories                                                  | ✅ setup + `Button` (each phase adds more) |
| §13 | Storybook deployed to GitHub Pages by CI                                                          | ✅                                         |
| §13 | Playwright E2E                                                                                    | ✅ smoke tests · each phase adds flows     |
| §13 | Playwright component tests                                                                        | 🔁 Storybook story tests in Chromium       |
| §3  | Tailwind CSS                                                                                      | ✅ v4                                      |

## Gaps found in this review

These weren't on the roadmap yet and have been added to ROADMAP.md:

1. **Bucket CORS (phase 2).** ARCHITECTURE.md says the bucket needs a CORS
   config so the tap-to-select model can read pixels from uploaded photos, but
   no roadmap item or owner step set it. Phase 2 now commits the config and the
   deploy workflow (or a SETUP.md step) applies it.
2. **Dashboard while live (phase 7).** PRD §10 puts the vote count, voter URL
   and "Open Results" on the dashboard itself, not only the event page.
3. **Results not open yet (phase 9).** Someone opening `/event/:id/results`
   early needs a friendly state; the results doc is unreadable until then.
4. **Placeholder pages named the wrong phases.** Fixed in this change (voter
   page → 8, results → 9, event setup → 3–7).

## Open questions for the owner

Each changes what people see, so per CLAUDE.md these need the owner's call.
Until answered, the recommended default is what gets built.

| #   | Question                                                                                                                       | Recommended default                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | PRD §6 says the admin flow is strictly linear, but also lets admins skip bakers. Lock later steps until earlier ones are done? | Every step is reachable; the stepper shows which are done, and only **Open Voting** is gated (roadmap phase 3 already assumes this). |
| Q2  | Can admins move an event backwards (voting → setup, results → voting)?                                                         | Yes, with a confirm dialog. Cookie edits stay locked once any ballot exists, because ballots reference cookie ids.                   |
| Q3  | Must voters rank something in every category before submitting?                                                                | No. Empty categories are allowed; the review screen highlights them and asks "Submit anyway?".                                       |
| Q4  | Removing a baker from the event when cookies are already assigned to them                                                      | Allowed; those cookies become unassigned again, and Open Voting stays blocked until they're reassigned.                              |
