# CookieVoting — agent guide

A festive, phone-first web app for running cookie competitions: admins photograph
plates of cookies, identify each cookie, assign bakers and open voting; voters
rank their top 3 per category; Borda-count results update live.

The owner does not review code. Agents build this across many sessions, so the
docs are the memory:

1. **[`docs/ROADMAP.md`](docs/ROADMAP.md)** — start here. Do the first phase that
   isn't ✅. At the end of the session, tick boxes, update statuses and add a
   session-log entry (what shipped, what's deferred, notes for next time).
2. **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — decisions, data model,
   security model, flows. Update it when a decision changes; don't let code and
   doc drift.
3. **[`ClaudePRD.md`](ClaudePRD.md)** — product requirements. Its _Tech Stack_
   and _Data Models_ sections are superseded by ARCHITECTURE.md.
   **[`docs/PRD-COVERAGE.md`](docs/PRD-COVERAGE.md)** maps each requirement to
   its phase and lists open owner questions; flip rows to ✅ as phases ship.
4. **[`docs/SETUP.md`](docs/SETUP.md)** — steps only the owner can do in the
   Firebase project. When a phase needs a new owner step, add it there and to
   ROADMAP.md → Owner actions.

If a choice has several reasonable answers with different product trade-offs,
ask the owner before building it. Engineering-only choices are yours: follow
the conventions below.

## Commands (run from the repo root)

```sh
npm ci                   # install all workspaces
npm run dev              # web app at http://localhost:5173
npm run check            # format:check + lint + typecheck + unit tests + build (run before every commit)
npm test                 # unit tests (all workspaces)
npm run test:stories     # every story rendered + play fn + axe, in Chromium
npm run test:emulators   # security rules + Cloud Functions tests on the Firebase emulators (needs Java 21)
npm run test:e2e         # Playwright against a build on the seeded emulators (mobile + desktop profiles)
npm run emulators        # local Firebase (UI at http://localhost:4000); then `npm run seed` in another shell
npm run storybook        # Storybook at http://localhost:6006
npm run format           # Prettier write
```

### Sandboxed / cloud sessions

In Claude Code on the web, the SessionStart hook
(`.claude/hooks/session-start.sh`) runs `npm install` and exports
`CHROMIUM_PATH=/opt/pw-browsers/chromium`. Chromium is preinstalled there for
an older Playwright release and browser downloads may be blocked, so the
story-test and E2E configs launch that binary when `CHROMIUM_PATH` is set.
Elsewhere, set it by hand if needed:

```sh
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:stories
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e
```

The hook also pre-fetches the emulator JARs. In cloud sessions the egress proxy
breaks the emulators talking to each other (the Functions emulator gets
"request blocked" registering triggers), so run anything that starts the
emulators with the proxy variables unset:

```sh
env -u HTTPS_PROXY -u https_proxy -u GLOBAL_AGENT_HTTPS_PROXY -u npm_config_https_proxy npm run test:emulators
```

When a new tool needs installing for every session (e.g. emulator downloads),
add it to the hook and keep the hook idempotent. CI installs its own Chromium.

## Firebase projects

- **Production: `cookie-voting`**, an existing project reused from the previous
  attempt (<https://cookie-voting.web.app>). Never deploy to it, write to its
  data or run CLI commands against it from a session. Changes reach it only
  through the CI deploy workflow on `main`.
- **Local and tests: `demo-cookie-voting`** on the Firebase emulators. All
  development and automated tests use this.

## Layout

```
apps/web/          React 19 + Vite SPA, Tailwind v4, React Router (data mode), Storybook, Playwright
packages/shared/   Pure TS domain logic (types, ballot rules, Borda scoring). No dependencies.
functions/         Cloud Functions: results recompute (bundled with esbuild into functions/dist)
firebase/          Rules, indexes, bucket CORS, rules tests, emulator seed script
fixtures/plates/   Real plate photos for detection work and E2E
```

## Conventions

- **TypeScript strict**, including `noUncheckedIndexedAccess`. Relative imports
  include the `.ts`/`.tsx` extension. `import type` for types
  (`verbatimModuleSyntax`).
- **Formatting:** Prettier (no semicolons, single quotes, width 100). **Lint:**
  oxlint. Both run in CI; `npm run check` must pass.
- **Domain logic goes in `packages/shared`** when it's pure and used by more than
  one place (web + functions) or benefits from unit tests. Keep Firebase SDK types
  out of it.
- **Components:** one folder per component in `apps/web/src/components/`
  (`Name/Name.tsx` + `Name.stories.tsx`). Every component has stories covering
  its states; use `play` functions for interaction tests. Stories must pass the
  axe checks (a11y violations fail the test run).
- **Styling:** Tailwind utilities using the semantic tokens in
  `apps/web/src/styles/theme.css` (`bg-primary`, `text-ink-muted`, …). Never
  hard-code colours in components; add a token instead.
- **Phones first:** design at 375 px wide; touch targets ≥ 44 px; admins use
  phones too, including in the plate editor.
- **Wide screens:** every page is one centred column inside `AppLayout`
  (`mx-auto max-w-5xl`, side padding `--gutter`), never left-aligned with empty
  space on the right. Voter pages are a narrower centred column
  (`ReadableLayout`, `max-w-readable`). Inside the column, content fills the
  width; grids add columns. Rows of tabs or chips never wrap: one row that
  scrolls sideways, edge to edge, only when it doesn't fit (see `Stepper`:
  `-mx-(--gutter) px-(--gutter) overflow-x-auto`, `w-max`).
- **Alignment checklist** (check screenshots at 375, ~1024 and ~1500 px before
  shipping UI):
  - Text of different sizes in one row shares a **baseline** (`items-baseline`), e.g.
    a title and its badge, or "Cookie Voting" and the page title in the app bar
    (`AppBarTitle`). Use `items-center` only when one side has no text (icons, photos).
  - **Edges line up.** The first thing in a row meets the column edge: pull out
    padding that only shows on hover (`Button flush="start"|"end"` for ghost buttons,
    `-ms-*` on rows of padded items like `Stepper`). The app bar's column matches the
    page's (`ReadableLayout` narrows it).
  - **Even insets.** A card or list row has the same inset on both sides, counting a
    trailing ghost button's padding; captions under an input start where its text does.
  - **Controls in one row are one height** (grid/flex stretch, not `items-center` on
    mismatched `min-h-*`), and icons centre on the control they belong to, not on a
    control plus its caption.
  - **Nothing hidden takes space:** modal dialogs render into `<body>` (see
    `ConfirmDialog`); a closed `<dialog>` left as the last child of a `space-y-*` stack
    still gets its sibling a margin.
  - **Fixed-size labels on scaled art** (ornament tags) get room reserved in px, not as
    a share of the scaled design.
  - Button labels may wrap: they stay centred and balanced (`buttonClasses`).
- **Pages are lazy routes** in `apps/web/src/app/routes.ts`. Keep heavy admin-only
  dependencies (e.g. the segmentation model) out of voter chunks.
- **Firestore listeners** must be unsubscribed on unmount (PRD: infrequent use,
  minimise reads). Read data through the hooks in `apps/web/src/lib/data.ts`
  (built on `useSubscription`), which do this for you.
- **Tests:** unit tests beside the code (`*.test.ts[x]`); rules tests in
  `firebase/tests/`; function tests that need the emulators in
  `functions/test/*.emulator.test.ts`; E2E specs in `apps/web/e2e/` (they run on
  the emulators with `firebase/scripts/seed.ts` data). New behaviour needs a test at the cheapest level that proves
  it.
- **Free tier is a requirement.** Before adding a service, dependency on a paid
  API, or a pattern that scales reads with voters², check it against the budget
  in ARCHITECTURE.md.
