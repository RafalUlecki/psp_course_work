# PropHover web app

Next.js App Router + TypeScript app for the PropHover course project. The product surface is the JSON API (`/api/hit-rate`, `/api/watchlist`) used by the Chrome extension. Cold-start, sample data, and the numbered demo (hover, 400s, clients A/B, tests) are in the [root README](../../README.md).

## Prerequisites

Same as CI: **Node.js 20**, **npm 10** (bundled with Node 20), **PostgreSQL 16**. See the [root README](../../README.md#prerequisites).

## Getting Started

Install dependencies and run the development server (from `apps/web`, with `apps/web/.env` already copied from `.env.example`):

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The document title is **PropHover**; the home page is empty on purpose. To run the API **and** rebuild the extension together, use `npm start` from the repo root instead.

```bash
npm test
npm run lint
npm run build
```

`npm test` is the unit-test command (Node test runner). It must be run from `apps/web` and also picks up `apps/extension/*.test.ts`. It does not need a database.

## Database (Prisma + Postgres)

The app uses [Prisma](https://www.prisma.io/) against PostgreSQL. Connection string: `DATABASE_URL` in `.env` (see `.env.example`; placeholders only, no real keys).

1. Run a local Postgres instance (Docker example; same image as CI). There is no Docker Compose file in this repo:

```bash
docker run --name prophover-postgres \
  -e POSTGRES_USER=prophover \
  -e POSTGRES_PASSWORD=prophover \
  -e POSTGRES_DB=prophover \
  -p 5432:5432 -d postgres:16
```

2. Copy `.env.example` to `.env` and set `DATABASE_URL`, for example:

```bash
DATABASE_URL="postgresql://prophover:prophover@localhost:5432/prophover"
```

3. Apply migrations:

```bash
# first-time / local schema changes
npm run db:migrate:dev

# apply existing migrations (empty or production-like DB)
npm run db:migrate
```

Other scripts: `npm run db:generate` (Prisma Client) and `npm run db:studio` (browse tables). `prisma generate` also runs on `npm install` via `postinstall`.

### Demo seed (Kaggle 2025–26 slice)

`players.id` is the dataset’s NBA `personId` (not serial). The demo command reads **only** the committed CSV — no network, no Kaggle login. There is no `npm run seed` script; use `seed:demo` (this also runs `seedTestClients`):

```bash
npm run db:migrate
npm run seed:demo
```

That seeds **every** player in the CSV into Postgres and writes the full name→id map to `apps/extension/players.json`. Optional filter: `npm run seed:demo -- --players "Luka Doncic,Austin Reaves"`. Idempotent. After re-seeding, rebuild and **reload the Chrome extension**. Source, licence, and columns: [`data/README.md`](data/README.md).

The same command upserts test **Client A** (`A`, Nikola Jokic `203999`) and **Client B** (`B`, Luka Doncic `1629029`) plus one watchlist row each. Watchlist reads/writes are scoped by the `X-Client-Id` header; missing → 400, unknown → 401. Curl examples: [root README](../../README.md#demo).
