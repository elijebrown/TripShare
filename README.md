# TripShare

Personal trip/photo sharing app. React + Mantine frontend, Hono API on Bun,
ParadeDB (Postgres + BM25 search) in Docker. One `package.json` for
everything; the frontend calls the API through an end-to-end-typed Hono RPC
client (`src/client/api/client.ts`).

## Layout

- `src/server` — Hono app. Routes are chained so `AppType` carries
  request/response types to the client.
- `src/client` — React app (Vite). Talks to the API via the `/api` dev-server
  proxy.
- `src/shared` — row types both sides import.

## Setup

1. Install [Bun](https://bun.sh) and Docker.
2. `cp .env.example .env` and fill in real values.
3. `bun install`
4. `docker compose up -d` (starts the database; the `photo-db` volume must
   exist: `docker volume create photo-db` on first setup, then restore the
   backup — see below).
5. `bun run dev` — API on :3000, frontend on :5173.

## Scripts

- `bun run dev` — server (watch) + Vite together
- `bun run dev:server` / `bun run dev:client` — individually
- `bun run build` — typecheck both projects + production client build
- `bun run lint` / `bun run format`

## Database

Shell in (password prompted — see `.env`):

    docker exec -it database psql -U $POSTGRES_USER -d $POSTGRES_DB -W

Back up:

    source .env && docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" database pg_dump -U "$POSTGRES_USER" --verbose --no-acl --no-owner "$POSTGRES_DB" > backupDatabase.sql

Restore:

    source .env && docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i database psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < backupDatabase.sql
