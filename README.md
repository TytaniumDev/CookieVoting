# 🍪 Cookie Voting

A festive, phone-first web app for running cookie competitions.

- **Admins** photograph each plate of cookies, tap each cookie to identify it,
  assign bakers, then open voting and results.
- **Voters** open a shared link, rank their top 3 cookies in each category, and
  watch live results.
- **Scoring** uses the Borda count (3/2/1 points) per category, plus an overall
  baker leaderboard, computed in the cloud.

Built with React + Vite + TypeScript on Firebase, designed to run entirely
within free tiers.

## Docs

- [Product requirements](ClaudePRD.md)
- [Architecture & decisions](docs/ARCHITECTURE.md)
- [Roadmap & progress](docs/ROADMAP.md)
- [Firebase setup (owner steps)](docs/SETUP.md)
- [Contributor / agent guide](CLAUDE.md) (commands and conventions)

## Quick start

```sh
npm ci
npm run dev      # http://localhost:5173
npm run check    # format, lint, typecheck, unit tests, build
```
