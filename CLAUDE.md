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
npm run test:e2e         # Playwright against a production build (mobile + desktop profiles)
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
functions/         Cloud Functions (phase 2)
firebase/          Rules + indexes (phase 2)
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
- **Pages are lazy routes** in `apps/web/src/app/routes.ts`. Keep heavy admin-only
  dependencies (e.g. the segmentation model) out of voter chunks.
- **Firestore listeners** must be unsubscribed on unmount (PRD: infrequent use,
  minimise reads).
- **Tests:** unit tests beside the code (`*.test.ts[x]`); E2E specs in
  `apps/web/e2e/`. New behaviour needs a test at the cheapest level that proves
  it.
- **Free tier is a requirement.** Before adding a service, dependency on a paid
  API, or a pattern that scales reads with voters², check it against the budget
  in ARCHITECTURE.md.
