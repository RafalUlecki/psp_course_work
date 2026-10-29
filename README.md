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

