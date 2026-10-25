# PropHover web app

Next.js App Router + TypeScript app for the PropHover course project.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the home page should show **PropHover**.

```bash
npm run build
npm run lint
```

## Database (Prisma + Postgres)

The app uses [Prisma](https://www.prisma.io/) against PostgreSQL. Connection string: `DATABASE_URL` in `.env` (see `.env.example`).

1. Run a local Postgres instance (Docker example):

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

`players.id` is the dataset’s NBA `personId` (not serial). The demo command reads **only** the committed CSV — no network, no Kaggle login:

```bash
npm run db:migrate
npm run seed:demo -- --players "Luka Doncic,Austin Reaves"
```

It always keeps the fixture player (Nikola Jokic) and his NBA id, is idempotent, and regenerates `apps/extension/players.json` plus the fixture `data-prophover-player-id`. After re-seeding, rebuild and **reload the Chrome extension**. A name that is not in the CSV fails the command and prints that player. Source, licence, and columns: [`data/README.md`](data/README.md).

### ESPN sample seed

```bash
npm run seed
```

Default CSV is [`data/fixtures/game_logs_sample.csv`](data/fixtures/game_logs_sample.csv) (2 players, 24 game logs, NBA `player_id` on each row). Re-running is idempotent (upserts by player id and `(playerId, source, sourceGameId)`). Pass another file as `npm run seed -- path/to.csv` or `SEED_CSV_PATH=…`. Wipe tables first with `npm run seed -- --reset`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
