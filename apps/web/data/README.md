# Game-log data

Small fixture used to seed `players` / `game_logs` (schema in `apps/web/prisma/`). Load it with `npm run seed` from `apps/web` (Prisma Client upserts; no raw SQL).

## Fixture

[`fixtures/game_logs_sample.csv`](fixtures/game_logs_sample.csv) is a **human-readable sample**, not a full season:

| Player | Team | Games | Home | Away | Date range |
| --- | --- | ---: | ---: | ---: | --- |
| Nikola Jokic | DEN | 12 | 8 | 4 | 2026-03-18 – 2026-04-12 |
| Shai Gilgeous-Alexander | OKC | 12 | 5 | 7 | 2026-03-17 – 2026-04-08 |

24 rows total. Each player has mixed home/away games and more than two opponents.

## Columns

Header row maps 1:1 to the seed importer:

```
player_name,team,game_date,opponent,venue,pts,reb,ast,source,source_game_id
```

| Column | Meaning |
| --- | --- |
| `player_name` | Player display name (upsert key for unique `players.name`) |
| `team` | Player’s team abbreviation that night |
| `game_date` | Tip-off calendar date `YYYY-MM-DD` in America/New_York (how ESPN lists the game) |
| `opponent` | Opponent team abbreviation (ESPN’s codes; see note below) |
| `venue` | `home` or `away` |
| `pts`, `reb`, `ast` | Box-score points / rebounds / assists |
| `source` | Always `espn` in this fixture |
| `source_game_id` | ESPN event id (unique with player + source) |

## Source

Real 2025-26 NBA **regular-season** box scores from ESPN’s public JSON, not invented numbers.

- Athlete gamelog: `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/gamelog` (season filter `2026` = 2025-26)
  - Nikola Jokic, ESPN athlete id `3112335`
  - Shai Gilgeous-Alexander, ESPN athlete id `4278073`
- Cross-checked against game summaries: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={id}` (`source_game_id` is that event id)

Last 12 regular-season appearances for each player in that season. ESPN opponent abbreviations are kept as returned (`GS`, `NY`, `SA`, `UTAH`, `WSH`, …) rather than remapped to NBA.com codes (`GSW`, `NYK`, `SAS`, `UTA`, `WAS`).

## Full-season dataset (not in git)

A full-season dump (for example a Kaggle or Hugging Face NBA game-log CSV) is **not** committed. Put a larger file next to this tree if you want one locally, e.g. `apps/web/data/nba_game_logs.full.csv`. `*.full.csv` under `apps/web/data/` is gitignored.

The seed accepts a path to any CSV in the same column format. Default is this fixture.

## Seed (CSV → Postgres)

From `apps/web`, with `DATABASE_URL` set (see `.env.example`):

```bash
# apply migrations, then load the fixture
npm run db:migrate
npm run seed
```

`prisma db seed` runs the same script (`prisma.seed` in `package.json`).

CSV path resolution, first match wins:

1. Positional argument (`argv[2]`), e.g. `npx tsx prisma/seed.ts data/nba_game_logs.full.csv`
2. `SEED_CSV_PATH`
3. `data/fixtures/game_logs_sample.csv`

```bash
SEED_CSV_PATH=data/nba_game_logs.full.csv npm run seed
npm run seed -- data/nba_game_logs.full.csv
```

Rows are validated before any writes (required columns, ISO `YYYY-MM-DD` dates, `home`/`away` venue, non-negative integer `pts`/`reb`/`ast`). A bad row fails the process with a `Row N: …` error and does not load remaining rows.

### Re-run behavior (idempotent)

Players are upserted by unique `players.name` (team is kept up to date). Game logs are upserted on `(playerId, source, sourceGameId)`, so a second run does **not** insert duplicates; box-score fields are refreshed from the CSV.

The script prints `Players upserted`, `Game logs inserted`, and `Game logs updated`. After a first load of this fixture you should see 2 players and 24 logs; a second run still has 24 logs (0 inserted, 24 updated).

### `--reset`

Deletes **all** `game_logs` then **all** `players` (Prisma Client `deleteMany`, in that order) before loading. Validation still runs first, so a bad CSV will not wipe the database.

```bash
npm run seed -- --reset
npm run seed -- --reset data/nba_game_logs.full.csv
```

`--reset` is destructive on the whole tables, not only rows present in the CSV.

Do not scrape HTML or download a full season in CI.
