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

Chromium is preinstalled at `/opt/pw-browsers/chromium` for an older Playwright
release, and downloading browsers may be blocked. The configs read
`CHROMIUM_PATH`:

```sh
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:stories
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e
```

CI installs its own Chromium and doesn't need this.

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
