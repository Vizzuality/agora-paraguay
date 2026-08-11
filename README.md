# Ágora Paraguay

Front end for the Ágora Paraguay platform, built with [TanStack Start](https://tanstack.com/start).

The API is **external and does not exist yet**, so the app currently serves mock data. See
[Data layer](#data-layer) for how it is wired and what changes when the real API arrives.

## Requirements

- Node **24** (`.nvmrc` — `nvm use`)
- pnpm **10.13.1** (pinned via `packageManager`; `corepack enable pnpm`)

## Getting started

```sh
nvm use
pnpm install
cp .env.example .env
pnpm dev            # http://localhost:3000
```

## Scripts

| Script              | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `pnpm dev`          | Dev server on port 3000                                 |
| `pnpm build`        | Production build into `.output`                         |
| `pnpm start`        | Runs the built server (`node .output/server/index.mjs`) |
| `pnpm test`         | Vitest, single run                                      |
| `pnpm test:watch`   | Vitest, watch mode                                      |
| `pnpm typecheck`    | `tsc --noEmit`                                          |
| `pnpm lint`         | oxlint                                                  |
| `pnpm format`       | oxfmt, writes                                           |
| `pnpm format:check` | oxfmt, check only (what CI runs)                        |

`pnpm build` generates `src/routeTree.gen.ts`, which `typecheck` and `lint` both need. On a fresh
clone, build before either.

## Data layer

Mock data lives behind a single seam so swapping in the real API is a one-file change:

```
src/lib/api/
├── schemas.ts              Zod schemas — the source of truth for types
├── fixtures/               Mock data. Nothing outside src/lib/api may import this
├── client.ts               The ONLY module that knows the data is fake
└── queries.ts              queryOptions factories — what components import
```

Rules that keep the swap cheap:

- Components import from `queries.ts` only, never from `client.ts` or `fixtures/`.
- Both the mock and the future real branch parse responses through the Zod schemas, so contract
  drift surfaces at the boundary instead of as `undefined` deep in a component.
- `VITE_USE_MOCK_API` (see `.env.example`) lets both paths coexist during the transition.

The current `Placeholder` model is **throwaway** — it exists to prove the path renders end to end.
The real schemas wait for the API contract.

Query state is fetched on the client after hydration; SSR sends the shell and a loading state.
Wiring server-side prefetch (`@tanstack/react-router-ssr-query`) was deliberately deferred until
there is a real API and real payload sizes to justify it.

## Deployment

One build, two targets, both driven by Nitro. The preset comes from `NITRO_PRESET`
(see `vite.config.ts`).

### Vercel — current

Set in the Vercel project:

- Framework preset: **Other**
- Build command: `pnpm build`, output directory: `.output`
- Environment variable: `NITRO_PRESET=vercel`

Confirm the build log reports the `vercel` preset and not `node-server`.

### Docker — handover

The client's backend team deploys the container. CI builds the image on every PR so it cannot rot
between now and then.

```sh
docker build -t agora-paraguay .
docker run -p 3000:3000 agora-paraguay
```

`VITE_*` variables are inlined by Vite at **build** time, so they are `ARG`s in the Dockerfile, not
runtime environment variables.

## Decisions

Recorded so they are not re-litigated. All were checked against the
[Vizzuality Tech Radar](https://github.com/Vizzuality/vizzuality-engineering-handbook/tree/main/decisions/tech-radar)
on 2026-08-11.

- **TanStack Start over Next.js.** Trial tier, chosen deliberately. The external API removes most of
  Next's advantages (RSC data fetching, fetch cache, ISR). Org precedent:
  `climate_risk_index_for_biodiversity`, `vizz-json`, `acorn`.
- **TanStack Charts is excluded.** Pre-alpha (`0.11.0`), APIs documented as unstable, docs describe
  an unreleased branch, no org usage. Use **Recharts** for charts, **visx** where custom marks are
  needed.
- **Terra Draw** rather than `@mapbox/mapbox-gl-draw` when the map arrives, and pin
  **MapLibre GL JS v5** — the Terra Draw adapter documents v4/v5 and `maplibre-gl` is already past
  that.
- **oxlint + oxfmt**, not ESLint or Prettier (ADR 001). Correctness rules are set to `error`, and
  the full `jsx-a11y` rule set is enabled — stricter than oxlint's defaults, which only warn.
- **prek for git hooks, not Husky.** Husky is the Adopt-tier default and prek is Trial, so this is a
  deliberate exception following the `climate_risk_index_for_biodiversity` precedent. Do not install
  Husky alongside it: Husky sets `core.hooksPath=.husky`, which silently disables prek's hook.
- **Native `queryOptions`**, not `query-key-factory` (Hold tier, unmaintained).
- **Query data loads client-side after hydration.** SSR prefetch via
  `@tanstack/react-router-ssr-query` was deferred until there is a real API and real payload sizes.

`src/routeTree.gen.ts` is generated and gitignored. The `ignorePatterns` entries for it in
`.oxlintrc.json` and `.oxfmtrc.json` are therefore redundant — oxc tools honour `.gitignore` — but
are kept in case it is ever committed.

## Quality

Linting and formatting follow [ADR 001](https://github.com/Vizzuality/vizzuality-engineering-handbook/blob/main/decisions/adr/001-standardise-js-ts-quality-toolchain-on-oxc.md)
— **oxlint and oxfmt**, not ESLint or Prettier. `prek` installs the pre-commit hooks via
`pnpm install`.

CI runs typecheck, lint, format check, tests, the production build, and the Docker build on every
pull request.
