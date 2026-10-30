# PropHover

`apps/web` is the Next.js hit-rate and watchlist API. `apps/extension` is a Chrome Manifest V3 content script for [betsson.lt](https://www.betsson.lt/): it finds NBA player points rows (name + line under a **Žaidėjo pelnyti taškai** market), shows a hover card with hit rate from the local API, and lets you star players onto a per-client watchlist.

## Prerequisites

Versions match CI (`.github/workflows/ci.yml`) and the local Postgres example in [apps/web/README.md](apps/web/README.md). There is no `engines` field in `package.json` and no Docker Compose file in this repo.

| Tool | Version | Source |
| --- | --- | --- |
| Node.js | **20** | CI `actions/setup-node` `node-version: 20` |
| npm | **10** (bundled with Node 20) | CI runs `npm ci`; this repo does not pin an npm version |
| PostgreSQL | **16** | CI service image `postgres:16` |
| Google Chrome | current stable, Manifest V3 | no version pinned; load unpacked from `apps/extension/dist` |

Docker is optional and only needed if you start Postgres with the `docker run` example below.

## Configuration

Copy the committed examples. Use **placeholder values only** — do not put real API keys or production secrets in these files, and do not commit `.env`.

```bash
cp apps/web/.env.example apps/web/.env
cp apps/extension/.env.example apps/extension/.env
```

`apps/web/.env.example` (placeholders as committed):

```bash
# Postgres connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"

# NextAuth secret — later
# NEXTAUTH_SECRET=""

# Public API base URL for browser requests
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
```

For the local/CI-style database used in this README, set:

```bash
DATABASE_URL="postgresql://prophover:prophover@localhost:5432/prophover"
```

`apps/extension/.env.example`:

```bash
VITE_HIT_RATE_API_BASE="http://localhost:3000"
```

`NEXTAUTH_SECRET` is commented out and unused. Leave it unset.

## Setup and run

There is **no** single script that installs dependencies, migrates, seeds, and starts the apps. After the steps below, **`npm start` from the repo root** is the one documented command that runs both the API and the extension watch build.

### 1. PostgreSQL 16

Any local Postgres 16 is fine. Docker example (same image and credentials as CI):

```bash
docker run --name prophover-postgres \
  -e POSTGRES_USER=prophover \
  -e POSTGRES_PASSWORD=prophover \
  -e POSTGRES_DB=prophover \
  -p 5432:5432 -d postgres:16
```

### 2. Env files, install, migrate, seed

From the repo root:

```bash
cp apps/web/.env.example apps/web/.env
# then set DATABASE_URL in apps/web/.env to the placeholder connection string above
cp apps/extension/.env.example apps/extension/.env

npm install
npm install --prefix apps/web
npm install --prefix apps/extension

cd apps/web
npm run db:migrate
npm run seed:demo
```

`npm run db:migrate` is `prisma migrate deploy` (apply existing migrations). For local schema changes use `npm run db:migrate:dev` instead. Other Prisma scripts: `npm run db:generate`, `npm run db:studio`. `prisma generate` also runs on `npm install` via `postinstall`.

`npm run seed:demo` is the seed command (there is no `npm run seed` script). It also runs `seedTestClients` for clients A and B. `npx prisma db seed` runs the same file (`prisma.seed` → `tsx prisma/seedDemo.ts`).

### 3. One command to run both apps

From the **repo root**:

```bash
npm start
```

That starts Next.js `dev` on [http://localhost:3000](http://localhost:3000) and rebuilds the extension into `apps/extension/dist` on change. Load unpacked once from `apps/extension/dist` (Chrome → `chrome://extensions` → Developer mode → **Load unpacked**). Reload the extension after the first build and after re-running `seed:demo` (seed rewrites `apps/extension/players.json`).

To run the web app alone: `cd apps/web && npm run dev`. To build the extension once: `cd apps/extension && npm run build`.

## Sample data

`npm run seed:demo` (from `apps/web`) reads only the committed CSV — no network, no Kaggle login:

- Source: [`apps/web/data/PlayerStatistics.csv`](apps/web/data/PlayerStatistics.csv) (2025–26 regular-season slice). Licence and columns: [apps/web/data/README.md](apps/web/data/README.md).
- Upserts **every** player in that CSV (currently **582** players and **26648** game logs). `players.id` is the NBA `personId` (not a serial).
- Writes the name → id map to `apps/extension/players.json`.
- Calls `seedTestClients` to upsert two hard-coded clients and one watchlist row each. Player stats and game logs stay shared.

| Client | `id` | Default watchlist player | NBA `personId` |
| --- | --- | --- | --- |
| Client A | `A` | Nikola Jokic | `203999` |
| Client B | `B` | Luka Doncic | `1629029` |

Optional smaller seed: `npm run seed:demo -- --players "Luka Doncic,Austin Reaves"` (fails if a name is missing from the CSV). Re-run after CSV updates, then rebuild and reload the extension.

## Demo

Numbered walkthrough from a configured database (complete [Setup and run](#setup-and-run) first). If betsson.lt has no NBA points market at demo time, use the curl fallback in step 4 — it hits the same API the hover card uses.

1. **Start the API and extension watch build** (repo root):

   ```bash
   npm start
   ```

   Wait until Next.js is listening on [http://localhost:3000](http://localhost:3000).

2. **Load the extension:** Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → `apps/extension/dist`. Open **Extension options** (`chrome://extensions` → PropHover → **Details** → **Extension options**) and leave **Client A** selected (the default).

3. **Main hover scenario (betsson.lt):** open [https://www.betsson.lt/](https://www.betsson.lt/), open an NBA event, and open the **Žaidėjo pelnyti taškai** market (a points header containing `taškai` and not `+`). Hover a seeded player (for example Nikola Jokic or Luka Doncic). The overlay card requests `GET /api/hit-rate` with `playerId`, `stat=PTS`, and the page line, and can change last-N / venue / line. The star adds or removes that player on the selected client’s watchlist (`X-Client-Id`).

4. **Fallback if there is no NBA points market:** keep `npm start` running and call the same endpoints locally (Jokic `203999`, default last 10 games, line `24.5`):

   ```bash
   curl -sS "http://localhost:3000/api/hit-rate?playerId=203999&stat=PTS&line=24.5"
   curl -sS "http://localhost:3000/api/hit-rate?playerId=1629029&stat=PTS&line=24.5"
   ```

   A 200 body includes `hitRate`, `hits`, `n`, and `games`. That is enough to demonstrate the product without betsson.lt.

5. **Error case (invalid input → 400):** omit `playerId` on the hit-rate route. The handler returns HTTP 400 with `{"error":"Missing playerId."}`:

   ```bash
   curl -sS -w "\nHTTP %{http_code}\n" "http://localhost:3000/api/hit-rate?stat=PTS&line=24.5"
   ```

   Other 400s from the same route include non-numeric `playerId` (`Invalid playerId.`) and a missing `line` (`Missing line.`).

6. **Client A/B in the extension:** on the options page, switch from **Client A** to **Client B**. That value is stored in `chrome.storage.local` (`clientId`) and sent as `X-Client-Id` on watchlist list/add/remove. Hover the same player again: Jokic’s star is filled for A and empty for B; Luka’s star is the reverse. There is no login.

7. **Client A/B with curl (`X-Client-Id`):** missing header → **400**; unknown id → **401**; known ids never fall back to the other client.

   ```bash
   # Client A's watchlist (Jokic 203999 after seed)
   curl -sS http://localhost:3000/api/watchlist -H "X-Client-Id: A"

   # Client B's watchlist (Luka 1629029 after seed)
   curl -sS http://localhost:3000/api/watchlist -H "X-Client-Id: B"

   # Missing header → 400 {"error":"Missing X-Client-Id header."}
   curl -sS -w "\nHTTP %{http_code}\n" http://localhost:3000/api/watchlist

   # Unknown id → 401 {"error":"Unknown client id."}
   curl -sS -w "\nHTTP %{http_code}\n" http://localhost:3000/api/watchlist -H "X-Client-Id: Z"
   ```

   Add/remove (the hover-card star uses the same routes):

   ```bash
   curl -sS -X POST http://localhost:3000/api/watchlist \
     -H "X-Client-Id: A" \
     -H "Content-Type: application/json" \
     -d '{"playerId":203999}'

   curl -sS -X DELETE "http://localhost:3000/api/watchlist?playerId=203999" \
     -H "X-Client-Id: A"
   ```

8. **Run the tests** (from `apps/web`; this is the only `npm test` script — it also runs `apps/extension/*.test.ts`):

   ```bash
   cd apps/web
   npm test
   ```

   Unit tests do not need Postgres. CI also runs `npm run lint` and `npm run build` in `apps/web`, plus `npm run build` in `apps/extension`.

## `apps/web` structure

Each **page** or **app shell feature** lives in a private folder under `app/` (prefix `_` so it is not a URL segment). Inside the feature:

```
app/
  page.tsx              # route entry (minimal; API is the product surface)
  layout.tsx
  api/                  # thin route handlers → src/lib
  _app/                 # root layout shell (providers, etc.)
    Providers.tsx
    utils/
      getQueryClient.ts
    types/
```

**Naming:** `PascalCase.tsx` for pages and components; `camelCase.ts` for utils, types, and style modules.

Postgres schema and migrations live in `apps/web/prisma/`. More database detail: [apps/web/README.md](apps/web/README.md#database-prisma--postgres). Extension load steps: [apps/extension/README.md](apps/extension/README.md).
