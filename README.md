# PropHover

`apps/web` is the Next.js app. `apps/extension` is the Chrome MV3 extension stub.

**AI / Cloud agents:** read [AGENTS.md](AGENTS.md) and [.cursor/rules/](.cursor/rules/) before implementing tasks.

## Start (web + extension watch)

One-time setup: Postgres running, `apps/web/.env` and `apps/extension/.env` from their `.env.example` files, then:

```bash
cd apps/web
npm run db:migrate
npm run seed:demo
```

From the repo root (install each app once if you have not already):

```bash
npm install
npm install --prefix apps/web
npm install --prefix apps/extension
npm start
```

That runs Next on [http://localhost:3000](http://localhost:3000) (hit-rate API) and rebuilds the extension into `apps/extension/dist` on change. Load unpacked once from `apps/extension/dist`, then open **betsson.lt** and hover a seeded player under **Žaidėjo pelnyti taškai**. Reload the extension after the first build and after `seed:demo`.

Postgres schema and migrations live in `apps/web/prisma/`. See [apps/web/README.md](apps/web/README.md#database-prisma--postgres) for how to run migrations against local Postgres.

Demo seed (2025–26 box scores, NBA `personId` as `players.id`):

```bash
cd apps/web
npm run db:migrate
npm run seed:demo
```

That seeds everyone in the CSV (no network). Re-run after CSV updates, then **rebuild and reload the Chrome extension** so `apps/extension/players.json` stays in sync. Source and licence: [apps/web/data/README.md](apps/web/data/README.md).

## Test clients (A vs B)

`seed:demo` also upserts two hard-coded clients, **Client A** (`id: A`) and **Client B** (`id: B`), each with one player-watchlist row (`clientId` FK). Player stats and game logs stay shared. Default seed puts Nikola Jokic on A’s watchlist and Luka Doncic on B’s.

The extension sends `X-Client-Id` on watchlist list/add/remove. There is no login: pick **Client A** or **Client B** on the extension options page (`chrome://extensions` → PropHover → **Details** → **Extension options**). That choice is stored in `chrome.storage.local` (`clientId`) and used as the header. Switching clients changes which hover-card stars are filled.

```bash
# Client A's watchlist only
curl -s http://localhost:3000/api/watchlist -H "X-Client-Id: A"

# Client B's watchlist only
curl -s http://localhost:3000/api/watchlist -H "X-Client-Id: B"

# Missing or unknown ids are rejected (400 / 401) and never fall back to the other client
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/watchlist
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/watchlist -H "X-Client-Id: Z"
```

Add/remove (star button uses the same routes):

```bash
curl -s -X POST http://localhost:3000/api/watchlist \
  -H "X-Client-Id: A" \
  -H "Content-Type: application/json" \
  -d '{"playerId":203999}'

curl -s -X DELETE "http://localhost:3000/api/watchlist?playerId=203999" \
  -H "X-Client-Id: A"
```

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

