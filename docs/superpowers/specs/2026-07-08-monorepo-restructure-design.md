# TripShare Restructure: Single-Package Bun + Hono RPC

**Date:** 2026-07-08
**Status:** Approved

## Goal

Collapse the two-package layout (`packages/back-express`, `packages/front-react`) into a single-package repo with one `package.json`, switch the backend from Express/Node to Hono on Bun, and give the frontend a fully typed RPC client so backend routes are consumed as typed function calls. Clean up unconventional structure along the way: side-effect route registration, hardcoded credentials, dead files, and the axios/lodash fetch layer.

## Decisions Made

| Decision | Choice |
|---|---|
| Type safety mechanism | Hono RPC (`hc<AppType>`) — types flow from route definitions to client automatically |
| Runtime | Bun (native TS, `--watch`, one lockfile) |
| Dev environment | Only ParadeDB stays in Docker; backend + frontend run locally via `bun run dev` |
| Package layout | One root `package.json`, no workspaces |
| Cleanup scope | Secrets to `.env`, delete dead files, untangle backend structure, tidy frontend fetch layer |

Alternatives considered: tRPC v11 (more boilerplate, non-standard HTTP — rejected because the API is read-heavy GET search endpoints where plain HTTP is a better fit) and Elysia + Eden (youngest ecosystem, rough type errors — rejected).

## Repo Layout

```
TripShare/
├── package.json          # all deps for both sides
├── bun.lock
├── tsconfig.json         # base
├── tsconfig.server.json  # bun types, no DOM
├── tsconfig.client.json  # DOM + JSX
├── vite.config.ts        # root: index.html → src/client; proxies /api → Hono
├── index.html
├── .env                  # gitignored
├── .env.example          # committed template
├── docker-compose.yml    # database service only
├── backupDatabase.sql
└── src/
    ├── server/
    │   ├── index.ts      # entry: reads env, Bun.serve
    │   ├── app.ts        # composes routers; exports AppType
    │   ├── db.ts         # pg Pool from env; camelCase row helper
    │   ├── routes/
    │   │   ├── search.ts # 6 search endpoints + ngram searches
    │   │   └── tables.ts # explicit per-table getters
    │   └── sql/statements.ts
    ├── client/
    │   ├── main.tsx
    │   ├── api/client.ts # export const api = hc<AppType>('/api')
    │   ├── components/   # App, Navbar, Home, Trip, Photos
    │   ├── features/     # HoverCardNavButtons, photoLayouts/, searchAnything/
    │   ├── state/        # zustand store + hooks
    │   ├── styles/
    │   └── types.ts      # client-only types
    └── shared/types.ts   # API row types both sides import
```

Scripts: `dev` (concurrently: `bun --watch src/server/index.ts` + `vite`), `dev:server`, `dev:client`, `build` (`tsc -b && vite build`), `lint`, `format`. ESLint and Prettier configs move to the root and cover both sides.

## Backend

1. **Chained/composed route definitions.** Routers are built with chained `.get()` calls and composed in `app.ts` via `.route()` — required for `AppType` inference. The current side-effect pattern (route files importing `app`/`pool` back from `server.ts`) is eliminated; route files import only `db.ts`.
2. **Dynamic table routes become explicit.** `fetchTableNames.ts` (queries `information_schema` at startup, generates routes, interpolates table names into SQL) is replaced by `tables.ts` declaring one route per table in use. Static routes are required for RPC typing; startup no longer blocks on a DB round-trip.
3. **Validation.** Hono `validator` on `?search=` query params.
4. **Response types.** Each query's row shape is declared in `src/shared/types.ts` (e.g. `TripSearchResult`). Hono types the transport; row shapes are hand-declared once per query.
5. **Errors.** Single `app.onError`: log server-side, return `{ error: message }` with status 500. Replaces `res.status(500).send(err)` (leaked internals) and the unhandled rejection in `/test`. The dead `/` route is dropped.
6. **casing.** snake_case → camelCase conversion happens server-side in one helper around `pool.query`, so declared types match the wire format.

## Frontend

1. `api/client.ts` is the whole integration: `hc<AppType>('/api')`. Calls look like `api.searchAll.$get({ query: { search: term } })` with typed responses.
2. **Deleted:** `async/fetch.ts`, `async/genericLoaderFunction.ts`, axios dependency, lodash dependency (only used for key-casing).
3. TanStack Query stays; `queryFn`s call the typed client.
4. `types-constants/` merges into `client/types.ts` (client-only) and `shared/types.ts` (API shapes). API base-URL constants die — the Vite proxy handles routing.
5. No UI redesign; components/features/state organization stays.

## Dev Workflow, Docker, Env

1. `docker-compose.yml` keeps only `database` (ParadeDB, same `photo-db` volume). App Dockerfiles and compose `watch` config are deleted.
2. Server connects to `localhost:5433` (the published port) instead of the Docker-internal `database` hostname.
3. `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` move to `.env`, read by docker-compose (`env_file`) and the server (`Bun.env`). `.env.local` is removed from git and `.env` is gitignored. Credentials currently sit in git history and the README; rotating the DB password at migration time is recommended (single `ALTER ROLE`) but optional for a local-only DB — decide at implementation.
4. README rewritten: `docker compose up -d database`, `bun install`, `bun run dev`; keep pg_dump/restore recipes.

## Deletions

- `oldDBCode/`
- all `.DS_Store` files (+ `.gitignore` entry)
- `packages/` directory shells, both `package-lock.json`s, `nodemon.json`
- `Dockerfile.back-express`, `Dockerfile.front-react`
- `packages/back-express/src/dbConfigFiles/*.txt` notes (not migrated to `src/server/`) — after verifying their SQL is captured in `backupDatabase.sql`/`statements.ts`
- finish the `photos/` removal already staged on the `dirCleanup` branch

## Testing / Acceptance

Smoke-level verification, not a test suite:

1. `bun run build` passes typechecks for server and client.
2. Every endpoint responds against the real DB; for a few known search terms, responses match the old Express responses (modulo camelCasing now being server-side).
3. Manual click-through of search and trip-photo flows in the UI.
4. `bun test` infrastructure is out of scope.

## Out of Scope

UI redesign, DB schema changes, new features, authentication, test infrastructure.
