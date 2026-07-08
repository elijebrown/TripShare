# Single-Package Bun + Hono RPC Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse `packages/back-express` + `packages/front-react` into one root package on Bun, replace Express with Hono, and give the frontend an end-to-end-typed RPC client.

**Architecture:** One root `package.json`/`bun.lock`. `src/server` is a Hono app (chained routes → exported `AppType`), `src/client` is the existing React app consuming `hc<AppType>('/api')` through a Vite dev proxy, `src/shared` holds row types both sides import. Only the ParadeDB container remains in Docker.

**Tech Stack:** Bun, Hono 4 (+ `hono/client`), pg, Vite 6, React 18, Mantine 7, TanStack Query 5, Zustand, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-07-08-monorepo-restructure-design.md`

## Global Constraints

- One `package.json` at repo root; no workspaces; `bun.lock` is the only lockfile.
- All endpoints keep their current paths and `?search=` param (exception: `/tripPhotos` renames its param to `?tripId=` — both ends change together).
- All responses are camelCased JSON arrays (camelCasing happens server-side in `queryRows`).
- SQL statements are copied verbatim from `packages/back-express/src/constants/sqlStatements.ts`, EXCEPT `memorySearch` whose current SQL (`SELECT DISTINCT m.id AS *`) is a syntax error and gets the fix shown in Task 2.
- Deviation from spec (flagged during planning): the `/tripNgram`, `/cityNgram`, `/provinceNgram` endpoints and `ngramSearchStringBuilder` are **dropped, not migrated**. `tripNgram` generates invalid SQL (`SELECT trip_name, , paradedb.score(id)` — broken today), and `cityNgram`/`provinceNgram` run the exact same SQL as `/citySearch`/`/provinceSearch`. Nothing in the frontend calls any of them.
- DB credentials appear ONLY in `.env` (gitignored) and `.env.example` (placeholder values). Never in source, compose, or README.
- Testing = typecheck + curl + psql cross-check + manual UI click-through. No test framework (per spec, out of scope).
- Prettier config: 4-space tabs, no semicolons, single quotes, es5 trailing commas (unchanged from current frontend config).
- Work happens on the existing `dirCleanup` branch.

---

### Task 1: Commit pending deletions, root scaffolding, `bun install`

**Files:**
- Commit as-is: pending `photos/` deletions + `.gitignore`/`.DS_Store` modifications already in the working tree
- Create: `package.json` (root), `tsconfig.json`, `tsconfig.client.json`, `tsconfig.server.json`, `vite.config.ts`, `index.html`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `postcss.config.cjs`, `.env`, `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `bun run dev` / `dev:server` / `dev:client` / `build` / `lint` / `format` scripts; tsconfig projects `tsconfig.client.json` (browser code, includes all of `src` so the client can type-import server routes) and `tsconfig.server.json` (`src/server` + `src/shared` + `vite.config.ts`, Bun types, no DOM); Vite proxy `/api/*` → `http://localhost:3000` with the `/api` prefix stripped.

- [ ] **Step 1: Commit the working-tree cleanup already staged on `dirCleanup`**

The branch already has `photos/` files deleted and `.gitignore` modified. Commit them so restructure commits stay clean:

```bash
git add -A
git commit -m "chore: remove committed photo binaries and stale .DS_Store files"
```

- [ ] **Step 2: Verify bun is installed**

Run: `bun --version`
Expected: a version ≥ 1.1. If not installed: `curl -fsSL https://bun.sh/install | bash` and restart the shell.

- [ ] **Step 3: Write root `package.json`**

```json
{
    "name": "tripshare",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "dev": "concurrently -n server,client -c blue,green \"bun run dev:server\" \"bun run dev:client\"",
        "dev:server": "bun --watch src/server/index.ts",
        "dev:client": "vite",
        "build": "tsc -b && vite build",
        "lint": "eslint .",
        "format": "prettier . --write"
    },
    "dependencies": {
        "@cloudinary/url-gen": "^1.21.0",
        "@mantine/carousel": "^7.15.2",
        "@mantine/core": "^7.15.2",
        "@mantine/hooks": "^7.15.2",
        "@tanstack/react-query": "^5.62.11",
        "embla-carousel-react": "^7.1.0",
        "hono": "^4.6.0",
        "pg": "^8.13.1",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router": "7.1.1",
        "zustand": "^5.0.3"
    },
    "devDependencies": {
        "@eslint/js": "^9.17.0",
        "@types/bun": "^1.1.14",
        "@types/pg": "^8.11.10",
        "@types/react": "^18.3.18",
        "@types/react-dom": "^18.3.5",
        "@vitejs/plugin-react": "^4.3.4",
        "concurrently": "^9.1.0",
        "eslint": "^9.17.0",
        "eslint-plugin-react-hooks": "^5.0.0",
        "eslint-plugin-react-refresh": "^0.4.16",
        "globals": "^15.14.0",
        "postcss": "^8.4.49",
        "postcss-preset-mantine": "^1.17.0",
        "postcss-simple-vars": "^7.0.1",
        "prettier": "3.4.2",
        "typescript": "~5.7.2",
        "typescript-eslint": "^8.18.2",
        "vite": "^6.0.5"
    }
}
```

Dropped vs the two old package.jsons (all verified unused by grep): `express`, `@types/express`, `cors`, `@types/cors`, `nodemon`, `ts-node`, `@types/node`, `axios`, `lodash`, `@types/lodash`, `@cloudinary/react`, `@mantine/modals`, `@mantine/nprogress`, `@mantine/spotlight`. `@mantine/hooks` stays (peer dependency of `@mantine/core`).

- [ ] **Step 4: Run `bun install`**

Run: `bun install`
Expected: exits 0, creates `bun.lock` and `node_modules/` at root.

- [ ] **Step 5: Write the three tsconfig files**

`tsconfig.json` (solution file — same pattern the old frontend already used):

```json
{
    "files": [],
    "references": [
        { "path": "./tsconfig.client.json" },
        { "path": "./tsconfig.server.json" }
    ]
}
```

`tsconfig.client.json` — includes ALL of `src` because `src/client/api/client.ts` type-imports the server's `AppType`; `"types": ["bun"]` gives it `Bun`/`process` globals for the server files it pulls in:

```json
{
    "compilerOptions": {
        "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.client.tsbuildinfo",
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "types": ["bun"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "isolatedModules": true,
        "moduleDetection": "force",
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedSideEffectImports": true
    },
    "include": ["src"]
}
```

`tsconfig.server.json` — no DOM lib, so accidental browser-global use in server code fails the build:

```json
{
    "compilerOptions": {
        "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.server.tsbuildinfo",
        "target": "ES2022",
        "lib": ["ES2023"],
        "types": ["bun"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "isolatedModules": true,
        "moduleDetection": "force",
        "noEmit": true,
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedSideEffectImports": true
    },
    "include": ["src/server", "src/shared", "vite.config.ts"]
}
```

- [ ] **Step 6: Write `vite.config.ts`, `index.html`, `postcss.config.cjs`**

`vite.config.ts` (the old `host: '0.0.0.0'` was for Docker — dropped; the old `'@'` alias was unused — dropped):

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
})
```

`index.html` (root — entry path updated for `src/client`, real title):

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TripShare</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/client/main.tsx"></script>
    </body>
</html>
```

`postcss.config.cjs` — copy `packages/front-react/postcss.config.cjs` verbatim:

```js
module.exports = {
    plugins: {
        'postcss-preset-mantine': {},
        'postcss-simple-vars': {
            variables: {
                'mantine-breakpoint-xs': '36em',
                'mantine-breakpoint-sm': '48em',
                'mantine-breakpoint-md': '62em',
                'mantine-breakpoint-lg': '75em',
                'mantine-breakpoint-xl': '88em',
            },
        },
    },
}
```

- [ ] **Step 7: Write `eslint.config.js`, `.prettierrc.json`, `.prettierignore`**

`eslint.config.js` (root; react plugins scoped to client files):

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    { ignores: ['dist'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
    },
    {
        files: ['src/client/**/*.{ts,tsx}'],
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
        },
    }
)
```

`.prettierrc.json` (unchanged values from the old frontend config):

```json
{
    "trailingComma": "es5",
    "tabWidth": 4,
    "semi": false,
    "singleQuote": true
}
```

`.prettierignore`:

```
dist
bun.lock
backupDatabase.sql
```

- [ ] **Step 8: Rotate the DB password, write `.env`, `.env.example`, update `.gitignore`**

The old password is burned into git history, so rotate it (user-approved decision). Start the DB (old compose still defines it), generate a new password, ALTER ROLE using the old password, then write `.env` with the NEW value:

```bash
docker compose up -d database
sleep 3
NEW_PW=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)
docker exec -e PGPASSWORD='APyRnWxbJu7JB#' database psql -U pablo_escobar_gaviria -d narcos -c "ALTER ROLE pablo_escobar_gaviria WITH PASSWORD '$NEW_PW';"
echo "$NEW_PW"   # needed for the .env below
```

Expected: `ALTER ROLE`. Verify the new password works before writing `.env`:

```bash
docker exec -e PGPASSWORD="$NEW_PW" database psql -U pablo_escobar_gaviria -d narcos -c 'SELECT 1;'
```

`.env` (real values, with the freshly generated password; NOT committed):

```
POSTGRES_USER=pablo_escobar_gaviria
POSTGRES_PASSWORD=<the generated NEW_PW value>
POSTGRES_DB=narcos
DB_HOST=localhost
DB_PORT=5433
SERVER_PORT=3000
```

`.env.example` (committed, placeholders only):

```
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=your_db_name
DB_HOST=localhost
DB_PORT=5433
SERVER_PORT=3000
```

`.gitignore` (replace entire file):

```
node_modules
dist
.env
.env.local
.DS_Store
```

- [ ] **Step 9: Commit**

```bash
git add package.json bun.lock tsconfig.json tsconfig.client.json tsconfig.server.json vite.config.ts index.html postcss.config.cjs eslint.config.js .prettierrc.json .prettierignore .env.example .gitignore
git commit -m "feat: root package.json, bun lockfile, and single-repo tooling configs"
```

Note: `.env` must NOT appear in `git status` after this (it's ignored). If it does, stop and fix `.gitignore`.

---

### Task 2: Shared types + server foundation (`db.ts`, SQL statements)

**Files:**
- Create: `src/shared/types.ts`, `src/server/db.ts`, `src/server/sql/statements.ts`

**Interfaces:**
- Consumes: `.env` vars from Task 1 (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DB_HOST`, `DB_PORT`).
- Produces: `queryRows<T>(text: string, params?: unknown[]): Promise<T[]>` from `src/server/db.ts` (camelCases row keys); row types `Trip`, `Memory`, `Photo`, `SearchResult`, `CitySearchResult`, `ProvinceSearchResult`, `CountrySearchResult`, `TripSearchResult`, `MemorySearchResult` from `src/shared/types.ts`; SQL string exports `citySearch`, `provinceSearch`, `countrySearch`, `tripSearch`, `memorySearch`, `searchAll`, `tripPhotos` from `src/server/sql/statements.ts`.

- [ ] **Step 1: Write `src/shared/types.ts`**

Column shapes verified against `backupDatabase.sql` CREATE TABLE statements. `date`/`tripDate` are typed as the wire format (JSON-serialized) since these types describe what the client receives:

```ts
// Row shapes as they cross the API boundary (camelCased, JSON-serialized).

export type Trip = {
    id: number
    tripName: string
    tripDate: string
    tripText: string | null
}

export type Memory = {
    id: number
    tripId: number
    memoryTitle: string | null
    memoryText: string | null
}

export type Photo = {
    id: number
    cityId: number | null
    photoFilepath: string
    date: string | null
    caption: string | null
}

export type City = {
    id: number
    provinceId: number
    cityName: string
}

export type Province = {
    id: number
    countryId: number
    provinceName: string
    provinceCode: string
}

export type Country = {
    id: number
    countryName: string | null
    countryCode: string | null
}

export type SearchResult = {
    id: number
    name: string
    type: 'city' | 'province' | 'country' | 'trip' | 'memory'
    score: number
}

export type CitySearchResult = {
    id: number
    cityName: string
    score: number
}

export type ProvinceSearchResult = {
    id: number
    provinceName: string
    score: number
}

export type CountrySearchResult = {
    id: number
    countryId: number
    countryName: string
    score: number
}

export type TripSearchResult = Trip & { score: number }

export type MemorySearchResult = Memory & { score: number }
```

- [ ] **Step 2: Write `src/server/db.ts`**

Credentials come from env (Bun auto-loads `.env` — no dotenv needed). `queryRows` is the single place snake_case → camelCase happens:

```ts
import { Pool } from 'pg'

export const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
})

const snakeToCamel = (str: string) =>
    str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())

export const queryRows = async <T>(
    text: string,
    params?: unknown[]
): Promise<T[]> => {
    const result = await pool.query(text, params)
    return result.rows.map(
        (row) =>
            Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    snakeToCamel(key),
                    value,
                ])
            ) as T
    )
}
```

- [ ] **Step 3: Write `src/server/sql/statements.ts`**

Copy the five working queries verbatim from `packages/back-express/src/constants/sqlStatements.ts`, renamed to match their endpoints. `memorySearch` is the fixed version (old one was invalid SQL). `tripPhotos` comes from `packages/back-express/src/routes/getTripPhotos.ts`. Do NOT copy `ngramSearchStringBuilder` or the commented-out query graveyard.

```ts
// All queries use prepared-statement params ($1). Copied from the legacy
// backend; memorySearch is fixed here (the original selected `m.id AS *`,
// a syntax error).

export const citySearch = `
    SELECT DISTINCT c.city_name, c.id, paradedb.score(c.id) AS score
FROM cities c
JOIN photos p ON p.city_id = c.id
WHERE c.city_name @@@ paradedb.fuzzy_phrase(
    field => 'city_name',
    value => $1,
    distance => 0
    )
ORDER BY score DESC
LIMIT 3
`

export const provinceSearch = `
 SELECT DISTINCT provinces.province_name, provinces.id, paradedb.score(provinces.id) AS score
FROM provinces
JOIN cities c ON provinces.id = c.province_id
JOIN photos ON photos.city_id = c.id
WHERE provinces.province_name @@@ paradedb.fuzzy_phrase(
    field => 'province_name',
    value => $1,
    distance => 0
    )
ORDER BY score DESC
LIMIT 3
`

export const countrySearch = `
    SELECT DISTINCT co.id, country_id, co.country_name, paradedb.score(co.id) AS score
FROM countries co
JOIN provinces p ON co.id = p.country_id
JOIN cities c ON p.id = c.province_id
JOIN photos ph ON c.id = ph.city_id
WHERE co.country_name @@@ paradedb.fuzzy_phrase(
    field => 'country_name',
    value => $1,
    distance => 0
    )
ORDER BY score DESC
LIMIT 3
`

export const tripSearch = `
    SELECT DISTINCT t.id, t.trip_name, t.trip_date, t.trip_text, paradedb.score(t.id) AS score
FROM trips t
WHERE t.trip_name @@@ paradedb.fuzzy_phrase(
    field => 'trip_name',
    value => $1,
    distance => 0
    )
    ORDER BY score DESC
    LIMIT 1
`

export const memorySearch = `
    SELECT DISTINCT m.id, m.trip_id, m.memory_title, m.memory_text, paradedb.score(m.id) AS score
FROM memories m
WHERE m.memory_title @@@ paradedb.fuzzy_phrase(
    field => 'memory_title',
    value => $1,
    distance => 0
    )
ORDER BY score DESC
LIMIT 3
`

export const tripPhotos = `
    WITH photo_ids AS (
        SELECT photo_id FROM trip_photos WHERE trip_id = $1
    )
    SELECT p.* FROM photos p JOIN photo_ids i ON p.id = i.photo_id
`

export const searchAll = `
  WITH
visited_cities AS (
    SELECT
        c.id AS id,
        c.city_name AS name,
        'city' AS type,
        paradedb.score(c.id) AS score
    FROM cities c
    JOIN photos p ON p.city_id = c.id
    WHERE c.city_name @@@ paradedb.fuzzy_phrase(
        field => 'city_name',
        value => $1,
        distance => 0
    )
    GROUP BY c.id, c.city_name
    ORDER BY score DESC
    LIMIT 3
),
visited_provinces AS (
    SELECT
        provinces.id AS id,
        provinces.province_name AS name,
        'province' AS type,
        paradedb.score(provinces.id) AS score
    FROM provinces
    JOIN cities c ON provinces.id = c.province_id
    JOIN photos ph ON ph.city_id = c.id
    WHERE provinces.province_name @@@ paradedb.fuzzy_phrase(
        field => 'province_name',
        value => $1,
        distance => 0
    )
    GROUP BY provinces.id, provinces.province_name
    ORDER BY score DESC
    LIMIT 3
),
visited_countries AS (
    SELECT
        co.id AS id,
        co.country_name AS name,
        'country' AS type,
        paradedb.score(co.id) AS score
    FROM countries co
    JOIN provinces p ON co.id = p.country_id
    JOIN cities c ON p.id = c.province_id
    JOIN photos ph ON c.id = ph.city_id
    WHERE co.country_name @@@ paradedb.fuzzy_phrase(
        field => 'country_name',
        value => $1,
        distance => 0
    )
    GROUP BY co.id, co.country_name
    ORDER BY score DESC
    LIMIT 3
),
trip_similarity AS (
    SELECT
        t.id AS id,
        t.trip_name AS name,
        'trip' AS type,
        paradedb.score(t.id) AS score
    FROM trips t
    WHERE t.trip_name @@@ paradedb.fuzzy_phrase(
        field => 'trip_name',
        value => $1,
        distance => 0
    )
    ORDER BY score DESC
    LIMIT 1
),
memory_similarity AS (
    SELECT
        m.id AS id,
        m.memory_title AS name,
        'memory' AS type,
        paradedb.score(m.id) AS score
    FROM memories m
    WHERE m.memory_title @@@ paradedb.fuzzy_phrase(
        field => 'memory_title',
        value => $1,
        distance => 0
    )
    GROUP BY m.id, m.memory_title
    ORDER BY score DESC
    LIMIT 3
)
SELECT * FROM visited_cities
UNION ALL
SELECT * FROM visited_provinces
UNION ALL
SELECT * FROM visited_countries
UNION ALL
SELECT * FROM trip_similarity
UNION ALL
SELECT * FROM memory_similarity
ORDER BY score DESC
`

// Explicit getter queries (replaces the runtime information_schema route
// generation from the old fetchTableNames.ts).
export const allTrips = `SELECT * FROM trips`
export const allMemories = `SELECT * FROM memories`
export const allPhotos = `SELECT * FROM photos`
export const allCities = `SELECT * FROM cities`
export const allProvinces = `SELECT * FROM provinces`
export const allCountries = `SELECT * FROM countries`
```

- [ ] **Step 4: Typecheck the server project**

Run: `bunx tsc -p tsconfig.server.json`
Expected: exits 0, no errors.

- [ ] **Step 5: Runtime-verify `queryRows` against the real DB**

Start the DB (the OLD docker-compose.yml still defines `database` at this point), write a throwaway smoke script outside the repo, and run it:

```bash
docker compose up -d database
SCRATCH=$(mktemp -d)
cat > "$SCRATCH/db-smoke.ts" <<'EOF'
import { queryRows, pool } from '/Users/elijah/Documents/TripShare/src/server/db'

const rows = await queryRows<{ tableName: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 3`
)
console.log(rows)
await pool.end()
EOF
cd /Users/elijah/Documents/TripShare && bun "$SCRATCH/db-smoke.ts"
```

Expected: prints three objects with a camelCased `tableName` key (proving both connectivity and key conversion). If connection is refused, the old DB container may need `docker compose up -d database` after Task 5's compose rewrite — for now the OLD docker-compose.yml still defines `database`, so `docker compose up -d database` works.

- [ ] **Step 6: Commit**

```bash
git add src/shared/types.ts src/server/db.ts src/server/sql/statements.ts
git commit -m "feat: shared API row types, pg pool with camelCase helper, migrated SQL"
```

---

### Task 3: Hono routes, app, entry point

**Files:**
- Create: `src/server/routes/search.ts`, `src/server/routes/tables.ts`, `src/server/app.ts`, `src/server/index.ts`

**Interfaces:**
- Consumes: `queryRows<T>` from `src/server/db.ts`; SQL exports from `src/server/sql/statements.ts`; row types from `src/shared/types.ts`.
- Produces: `AppType` (exported from `src/server/app.ts`) — the type consumed by `hc<AppType>` in Task 4. Endpoints: `GET /searchAll|citySearch|provinceSearch|countrySearch|tripSearch|memorySearch?search=<str>`, `GET /tripPhotos?tripId=<int>`, `GET /trips|/memories|/photos|/cities|/provinces|/countries`. All return camelCased JSON arrays; errors return `{ error: string }` with status 400/500.

- [ ] **Step 1: Write `src/server/routes/search.ts`**

Routes MUST be defined in one chained expression — that's what makes `AppType` inference carry route/response types to the client:

```ts
import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { queryRows } from '../db'
import * as sql from '../sql/statements'
import type {
    CitySearchResult,
    CountrySearchResult,
    MemorySearchResult,
    ProvinceSearchResult,
    SearchResult,
    TripSearchResult,
} from '../../shared/types'

// Normalizes ?search= to a single string ('' when absent), matching the
// legacy behavior of `req.query.search || ''`.
const searchQuery = validator('query', (value) => {
    const raw = Array.isArray(value.search) ? value.search[0] : value.search
    return { search: typeof raw === 'string' ? raw : '' }
})

export const searchRoutes = new Hono()
    .get('/searchAll', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(await queryRows<SearchResult>(sql.searchAll, [search]))
    })
    .get('/citySearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<CitySearchResult>(sql.citySearch, [search])
        )
    })
    .get('/provinceSearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<ProvinceSearchResult>(sql.provinceSearch, [search])
        )
    })
    .get('/countrySearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<CountrySearchResult>(sql.countrySearch, [search])
        )
    })
    .get('/tripSearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<TripSearchResult>(sql.tripSearch, [search])
        )
    })
    .get('/memorySearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<MemorySearchResult>(sql.memorySearch, [search])
        )
    })
```

- [ ] **Step 2: Write `src/server/routes/tables.ts`**

```ts
import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { HTTPException } from 'hono/http-exception'
import { queryRows } from '../db'
import * as sql from '../sql/statements'
import type {
    City,
    Country,
    Memory,
    Photo,
    Province,
    Trip,
} from '../../shared/types'

const tripIdQuery = validator('query', (value) => {
    const raw = Array.isArray(value.tripId) ? value.tripId[0] : value.tripId
    if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
        throw new HTTPException(400, {
            message: 'tripId must be a positive integer',
        })
    }
    return { tripId: raw }
})

export const tableRoutes = new Hono()
    .get('/trips', async (c) => c.json(await queryRows<Trip>(sql.allTrips)))
    .get('/memories', async (c) =>
        c.json(await queryRows<Memory>(sql.allMemories))
    )
    .get('/photos', async (c) => c.json(await queryRows<Photo>(sql.allPhotos)))
    .get('/cities', async (c) => c.json(await queryRows<City>(sql.allCities)))
    .get('/provinces', async (c) =>
        c.json(await queryRows<Province>(sql.allProvinces))
    )
    .get('/countries', async (c) =>
        c.json(await queryRows<Country>(sql.allCountries))
    )
    .get('/tripPhotos', tripIdQuery, async (c) => {
        const { tripId } = c.req.valid('query')
        return c.json(
            await queryRows<Photo>(sql.tripPhotos, [Number(tripId)])
        )
    })
```

- [ ] **Step 3: Write `src/server/app.ts`**

```ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import { searchRoutes } from './routes/search'
import { tableRoutes } from './routes/tables'

export const app = new Hono()
    .use(logger())
    .route('/', searchRoutes)
    .route('/', tableRoutes)

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({ error: err.message }, err.status)
    }
    console.error(err)
    return c.json({ error: 'Internal server error' }, 500)
})

export type AppType = typeof app
```

Notes: no CORS middleware — the Vite proxy makes browser requests same-origin. The legacy `/`, `/test`, and dynamic per-table routes from `fetchTableNames.ts` are intentionally gone (dead or replaced by `tables.ts`).

- [ ] **Step 4: Write `src/server/index.ts`**

```ts
import { app } from './app'

const server = Bun.serve({
    port: Number(process.env.SERVER_PORT ?? 3000),
    fetch: app.fetch,
})

console.log(`TripShare API running on ${server.url}`)
```

- [ ] **Step 5: Typecheck**

Run: `bunx tsc -p tsconfig.server.json`
Expected: exits 0.

- [ ] **Step 6: Runtime smoke test every endpoint**

```bash
docker compose up -d database
bun run dev:server &   # or run in a second terminal
sleep 1
curl -s 'http://localhost:3000/trips' | head -c 300; echo
curl -s 'http://localhost:3000/memories' | head -c 300; echo
curl -s 'http://localhost:3000/photos' | head -c 300; echo
curl -s 'http://localhost:3000/cities' | head -c 300; echo
curl -s 'http://localhost:3000/provinces' | head -c 300; echo
curl -s 'http://localhost:3000/countries' | head -c 300; echo
curl -s 'http://localhost:3000/searchAll?search=ban' | head -c 300; echo
curl -s 'http://localhost:3000/citySearch?search=ban' | head -c 300; echo
curl -s 'http://localhost:3000/provinceSearch?search=br' | head -c 300; echo
curl -s 'http://localhost:3000/countrySearch?search=ca' | head -c 300; echo
curl -s 'http://localhost:3000/tripSearch?search=trip' | head -c 300; echo
curl -s 'http://localhost:3000/memorySearch?search=a' | head -c 300; echo
curl -s 'http://localhost:3000/tripPhotos?tripId=1' | head -c 300; echo
curl -s 'http://localhost:3000/tripPhotos?tripId=abc'; echo   # expect {"error":"tripId must be a positive integer"}
```

Expected: every endpoint returns a JSON array (possibly `[]` for search misses — try other search terms against known data if all come back empty) with camelCased keys (`tripName`, `photoFilepath`, ...). The last call returns the 400 error JSON.

Cross-check one search against the DB directly (same SQL, so rows must match):

```bash
source .env && docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" database psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT c.city_name, paradedb.score(c.id) FROM cities c JOIN photos p ON p.city_id = c.id WHERE c.city_name @@@ paradedb.fuzzy_phrase(field => 'city_name', value => 'ban', distance => 0) ORDER BY 2 DESC LIMIT 3;"
```

Expected: same city names as the `/citySearch?search=ban` response.

- [ ] **Step 7: Commit**

```bash
git add src/server/routes/search.ts src/server/routes/tables.ts src/server/app.ts src/server/index.ts
git commit -m "feat: Hono app with chained typed routes replacing Express backend"
```

---

### Task 4: Client migration — move, typed RPC client, component updates

**Files:**
- Move: `git mv packages/front-react/src src/client`, `git mv packages/front-react/public public`
- Create: `src/client/api/client.ts`, `src/client/api/loaders.ts`, `src/client/constants.ts`
- Modify: `src/client/main.tsx`, `src/client/components/App.tsx`, `src/client/components/Navbar.tsx`, `src/client/components/Trip.tsx`, `src/client/components/Photos.tsx`, `src/client/features/HoverCardNavButtons.tsx`, `src/client/features/searchAnything/SearchAnything.tsx`, `src/client/state/store.ts`
- Delete: `src/client/async/` (both files), `src/client/types-constants/` (both files), `src/client/utils/snakeToCamel.ts` (and `utils/` if empty), `src/client/assets/react.svg` (and `assets/` if empty)

**Interfaces:**
- Consumes: `AppType` from `src/server/app.ts`; row types from `src/shared/types.ts`.
- Produces: `api = hc<AppType>('/api')` from `src/client/api/client.ts`; `tripPhotosLoader({ params }): Promise<Photo[]>` and `photosLoader(): Promise<Photo[]>` from `src/client/api/loaders.ts`; `defSpacing = 10` from `src/client/constants.ts`.

- [ ] **Step 1: Move the source with history**

```bash
mkdir -p src
git mv packages/front-react/src src/client
git mv packages/front-react/public public
git rm -r src/client/async src/client/types-constants src/client/utils src/client/assets
```

- [ ] **Step 2: Write `src/client/api/client.ts` and `src/client/constants.ts`**

`src/client/api/client.ts`:

```ts
import { hc } from 'hono/client'
import type { AppType } from '../../server/app'

// All requests go through the Vite dev proxy (/api → localhost:3000).
export const api = hc<AppType>('/api')
```

`src/client/constants.ts` (only survivor of the old `types-constants/constants.ts` — `urlBasePath` and `cldBaseUrl` were unused):

```ts
export const defSpacing = 10
```

- [ ] **Step 3: Write `src/client/api/loaders.ts`**

```ts
import type { LoaderFunctionArgs } from 'react-router'
import { api } from './client'

export const tripPhotosLoader = async ({ params }: LoaderFunctionArgs) => {
    const res = await api.tripPhotos.$get({
        query: { tripId: params.tripId ?? '' },
    })
    return res.json()
}

export const photosLoader = async () => {
    const res = await api.photos.$get()
    return res.json()
}
```

- [ ] **Step 4: Rewrite `src/client/main.tsx`**

Same router structure; loaders now come from `api/loaders.ts`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './components/App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Trip } from './components/Trip.tsx'
import { Photos } from './components/Photos.tsx'
import { photosLoader, tripPhotosLoader } from './api/loaders.ts'

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: 'trips/',
                children: [
                    {
                        index: true,
                        element: <h1>index</h1>,
                    },
                    {
                        path: ':tripId',
                        element: <Trip />,
                        loader: tripPhotosLoader,
                    },
                ],
            },
            {
                path: 'memories/',
                children: [
                    {
                        index: true,
                        element: <h1>index</h1>,
                    },
                    {
                        path: ':memoriesid',
                        element: <h1>Memory detail — not built yet</h1>,
                    },
                ],
            },
            {
                path: 'photos',
                element: <Photos />,
                loader: photosLoader,
            },
        ],
    },
])

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
)
```

- [ ] **Step 5: Fix `src/client/components/App.tsx`**

`QueryClient` moves outside the component (the old code created a new client every render, wiping the cache):

```tsx
import '../styles/App.css'
import '@mantine/core/styles.css'
import '@mantine/carousel/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { Navbar } from './Navbar'
import { Outlet } from 'react-router'

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider defaultColorScheme="dark">
                <Navbar />
                <Outlet />
            </MantineProvider>
        </QueryClientProvider>
    )
}

export default App
```

- [ ] **Step 6: Update `src/client/components/Trip.tsx` and `Photos.tsx`**

`Trip.tsx` (dead commented JSX, unused `useEffect` logging, and per-render `Cloudinary` import removed):

```tsx
import { useLoaderData } from 'react-router'
import { CarouselView } from '../features/photoLayouts/CarouselView'
import { tripPhotosLoader } from '../api/loaders'

export const Trip = () => {
    const photos = useLoaderData<typeof tripPhotosLoader>()

    return <CarouselView photos={photos ?? []} />
}
```

`Photos.tsx`:

```tsx
import { useLoaderData } from 'react-router'
import { LibraryView } from '../features/photoLayouts/LibraryView'
import { photosLoader } from '../api/loaders'

export const Photos = () => {
    const photos = useLoaderData<typeof photosLoader>()

    return <LibraryView photos={photos ?? []} />
}
```

- [ ] **Step 7: Update `src/client/state/store.ts` to shared types**

```ts
import { create } from 'zustand'
import type { Memory, Trip } from '../../shared/types'

type viewType = 'carousel' | 'quad' | 'compact' | 'library'
type imageQuality = 'best' | 'high' | 'low'
type storeState = {
    view: viewType
    quality: imageQuality
    tripsData: Trip[]
    memoriesData: Memory[]
}

type storeAction = {
    storeActions: {
        setView: (view: viewType) => void
    }
}

type storeType = storeState & storeAction

export const useStore = create<storeType>()((set) => ({
    view: 'carousel',
    quality: 'high',
    tripsData: [],
    memoriesData: [],
    storeActions: {
        setView: (view) => set({ view }),
    },
}))
```

- [ ] **Step 8: Update `src/client/features/HoverCardNavButtons.tsx`**

Three fixes: typed client instead of `fetch.ts`; `useStore.setState` during render moves into `useEffect`; `val.memoryName` (a field that never existed — buttons rendered blank) becomes `val.memoryTitle`:

```tsx
import { Button, HoverCard, Stack } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import { api } from '../api/client'
import { useStore } from '../state/store'

export const HoverCardNavButtons = () => {
    const navigate = useNavigate()

    const trips = useQuery({
        queryKey: ['trips'],
        queryFn: async () => (await api.trips.$get()).json(),
    })

    const memories = useQuery({
        queryKey: ['memories'],
        queryFn: async () => (await api.memories.$get()).json(),
    })

    useEffect(() => {
        if (trips.data) {
            useStore.setState({ tripsData: trips.data })
        }
    }, [trips.data])

    useEffect(() => {
        if (memories.data) {
            useStore.setState({ memoriesData: memories.data })
        }
    }, [memories.data])

    return (
        <>
            <HoverCard withArrow>
                <HoverCard.Target>
                    <Button
                        variant="subtle"
                        color="orange"
                        size="md"
                        className="no-click-cursor"
                    >
                        Trips
                    </Button>
                </HoverCard.Target>
                <HoverCard.Dropdown p={0}>
                    <Stack gap={0}>
                        {trips.data?.map((val) => (
                            <Button
                                color="gray"
                                radius={0}
                                variant="subtle"
                                key={val.id}
                                onClick={() => {
                                    navigate(`trips/${val.id}`)
                                }}
                            >
                                {val.tripName}
                            </Button>
                        ))}
                    </Stack>
                </HoverCard.Dropdown>
            </HoverCard>
            <HoverCard withArrow>
                <HoverCard.Target>
                    <Button
                        variant="subtle"
                        color="orange"
                        size="md"
                        className="no-click-cursor"
                    >
                        Memories
                    </Button>
                </HoverCard.Target>
                <HoverCard.Dropdown p={0}>
                    <Stack gap={0}>
                        {memories.data?.map((val) => (
                            <Button
                                color="gray"
                                radius={0}
                                variant="subtle"
                                key={val.id}
                                onClick={() => {
                                    navigate(`memories/${val.id}`)
                                }}
                            >
                                {val.memoryTitle}
                            </Button>
                        ))}
                    </Stack>
                </HoverCard.Dropdown>
            </HoverCard>
        </>
    )
}
```

- [ ] **Step 9: Update `src/client/features/searchAnything/SearchAnything.tsx`**

Typed client; the `<p>{Math.random()}</p>` debug line and the commented-out Combobox experiment are removed:

```tsx
import { Autocomplete, MantineSize } from '@mantine/core'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client'

type props = {
    size?: MantineSize
}

export const SearchAnything = ({ size }: props) => {
    const [results, setResults] = useState<string[]>([])

    const handleChange = async (value: string) => {
        if (!value) {
            setResults([])
            return
        }
        const res = await api.searchAll.$get({ query: { search: value } })
        const searchResults = await res.json()
        setResults(
            searchResults.map(
                (searchObj) =>
                    `${searchObj.name}: ${searchObj.type === 'province' ? 'region' : searchObj.type}`
            )
        )
    }

    const navigate = useNavigate()

    return (
        <Autocomplete
            size={size || 'sm'}
            data={results}
            placeholder="Search Anything.."
            onChange={handleChange}
            onOptionSubmit={() => {
                navigate('/')
            }}
        />
    )
}
```

- [ ] **Step 10: Update remaining imports**

`src/client/components/Navbar.tsx`: change `import { defSpacing } from '../types-constants/constants'` to `import { defSpacing } from '../constants'`. No other changes.

`src/client/features/photoLayouts/CarouselView.tsx` and `LibraryView.tsx`: change `import { photosType } from '../../types-constants/types'` to `import type { Photo } from '../../../shared/types'`, and change `type props = { photos: photosType[] }` to `type props = { photos: Photo[] }` in both files. No other changes.

- [ ] **Step 11: Typecheck both projects and lint**

Run: `bunx tsc -b`
Expected: exits 0. Common failure: `noUnusedLocals` flagging leftover imports in modified files — remove them.

Run: `bun run lint`
Expected: exits 0 (warnings acceptable, errors not).

- [ ] **Step 12: Manual smoke in the browser**

```bash
docker compose up -d database
bun run dev
```

Open `http://localhost:5173`:
- Hover "Trips" → trip names listed; click one → carousel of photos renders.
- Hover "Memories" → memory titles listed (previously blank — this is the `memoryTitle` fix).
- Click "Photos" → photo library grid renders.
- Type in "Search Anything" (e.g. a city you've visited) → suggestions appear.
- DevTools console: no errors; Network tab shows requests to `/api/...` returning 200.

- [ ] **Step 13: Commit**

```bash
git add -A src/client public index.html
git commit -m "feat: move React app to src/client with typed Hono RPC client"
```

---

### Task 5: Docker, env, README, and dead-file cleanup

**Files:**
- Modify: `docker-compose.yml`, `README.md`
- Delete: `packages/` (everything remaining), `oldDBCode/`, `Dockerfile.back-express`, `Dockerfile.front-react`, `.dockerIgnore`, `.env.local` (from git AND disk — its values now live in `.env`), all `.DS_Store`

**Interfaces:**
- Consumes: `.env` values from Task 1.
- Produces: `docker compose up -d` starts ONLY the database; README documents the new workflow.

- [ ] **Step 1: Replace `docker-compose.yml`**

```yaml
services:
  database:
    image: paradedb/paradedb:latest
    container_name: database
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5433:5432"
    volumes:
      - photo-db:/var/lib/postgresql/data

volumes:
  photo-db:
    external: true
```

Compose reads `${...}` from `.env` automatically. The app services, network, and watch config are gone.

- [ ] **Step 2: Verify the DB still comes up with env-driven config**

```bash
docker compose down
docker compose up -d
docker compose ps
```

Expected: only `database` running. Then confirm the app still connects: `curl -s 'http://localhost:3000/trips' | head -c 100` (with `bun run dev:server` running).

- [ ] **Step 3: Delete dead files**

Before deleting, verify the only content in `packages/back-express/src/dbConfigFiles/` is scratch notes (queries.txt / indexes.txt — already confirmed during planning to be one-off index/query snippets, superseded by `statements.ts` and the pg_dump backup):

```bash
git rm -r packages oldDBCode
git rm Dockerfile.back-express Dockerfile.front-react .dockerIgnore
git rm --cached .env.local && rm .env.local
find . -name '.DS_Store' -not -path './node_modules/*' -delete
git rm --cached .DS_Store 2>/dev/null || true
```

Note: `.env.local`'s values (DB creds + `CLOUDINARY_BASEURL`) are already represented — creds in `.env`, and the Cloudinary base URL was only consumed by the unused `cldBaseUrl` constant deleted in Task 4 (the cloud name is hardcoded in the photo views, unchanged from before).

- [ ] **Step 4: Rewrite `README.md`**

```markdown
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
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: db-only docker-compose, env-driven secrets, delete legacy packages and dead files"
```

Check: `git status` must be clean, and `git ls-files | grep -E 'packages/|oldDBCode|Dockerfile|\.env\.local|\.DS_Store'` must output nothing.

---

### Task 6: Final verification pass

**Files:** none created — verification only.

- [ ] **Step 1: Clean-slate install check**

```bash
rm -rf node_modules && bun install
```

Expected: exits 0 from the lockfile.

- [ ] **Step 2: Full build**

Run: `bun run build`
Expected: `tsc -b` passes (both projects) and Vite emits `dist/`.

- [ ] **Step 3: Lint + format check**

```bash
bun run lint
bunx prettier . --check
```

Expected: lint exits 0; if prettier reports unformatted files, run `bun run format` and amend the previous commit.

- [ ] **Step 4: Endpoint sweep through the proxy**

With `docker compose up -d` and `bun run dev` running:

```bash
for ep in trips memories photos cities provinces countries; do
  echo "== $ep"; curl -s "http://localhost:5173/api/$ep" | head -c 200; echo
done
for ep in searchAll citySearch provinceSearch countrySearch tripSearch memorySearch; do
  echo "== $ep"; curl -s "http://localhost:5173/api/$ep?search=ban" | head -c 200; echo
done
curl -s 'http://localhost:5173/api/tripPhotos?tripId=1' | head -c 200; echo
```

Expected: all JSON arrays with camelCased keys; no 500s.

- [ ] **Step 5: UI click-through**

Repeat Task 4 Step 12's browser checks against `bun run dev`. All flows work, console clean.

- [ ] **Step 6: Final commit if anything changed, and report**

Report to the user: endpoints verified, build/lint green, and the two pre-existing bugs fixed along the way (broken `/memorySearch` SQL, blank Memory buttons), plus dropped endpoints (`/tripNgram`, `/cityNgram`, `/provinceNgram`, `/`, `/test`).
