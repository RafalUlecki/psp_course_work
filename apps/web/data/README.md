# Game-log data

`players.id` is the NBA `personId` from the box-score dataset (no auto-increment). Load demo data with `npm run seed:demo` from `apps/web`.

## Demo CSV (2025–26 season slice)

[`PlayerStatistics.csv`](PlayerStatistics.csv) is a **trimmed 2025–26 regular-season slice** of `PlayerStatistics.csv` from Eoin A. Moore’s Kaggle dataset [NBA Dataset: Box Scores and Stats (1947 - Today)](https://www.kaggle.com/datasets/eoinamoore/historical-nba-data-and-player-box-scores).

- **Licence:** [CC0 1.0 Universal (public domain)](https://creativecommons.org/publicdomain/zero/1.0/)
- **Author:** Eoin A. Moore
- **How this file was obtained:** Kaggle requires a login to download the full dump. This slice was taken from the public CC0 Hugging Face mirror [`cbratkovics/nba-game-logs`](https://huggingface.co/datasets/cbratkovics/nba-game-logs) (`game_logs/game_logs_2025-26.parquet`), which is built from the same Kaggle `PlayerStatistics.csv` (and `TeamHistories.csv` for team abbreviations). Player ids are that dataset’s NBA `personId` values. Rows are regular-season games in which the player played (DNP rows dropped upstream). Columns are only those the app stores today.

| Column | PlayerStatistics / app meaning |
| --- | --- |
| `personId` | NBA player id → `players.id` |
| `playerName` | `firstName` + `lastName` |
| `team` | Player team abbreviation (`TeamHistories`) |
| `opponent` | Opponent team abbreviation |
| `home` | `1` home, `0` away |
| `gameDate` | Game date `YYYY-MM-DD` |
| `gameId` | NBA game id → `game_logs.source_game_id` (`source` is `kaggle`) |
| `points` | PTS (the hover card stat) |
| `reboundsTotal` | Stored because `game_logs.reb` is required |
| `assists` | Stored because `game_logs.ast` is required |

Do not add other box-score stats to this file. The name map is `normalized name → personId` only.

### Demo seed

From `apps/web`, with `DATABASE_URL` set (see `.env.example`):

```bash
npm run db:migrate
npm run seed:demo -- --players "Luka Doncic,Austin Reaves"
```

`npm run seed:demo` with no `--players` uses that same default list. **Nikola Jokic is always included** so the fixture page keeps working. The command:

1. Reads only the committed CSV (no network).
2. Fails and names the player when a requested name is not in the CSV.
3. Upserts `players` by `personId` and game logs by `(playerId, source, sourceGameId)` (idempotent; insert order does not change ids).
4. Writes `apps/extension/players.json` (normalized name → player id) from the seeded set.
5. Sets `apps/web/public/fixture/props.html` `data-prophover-player-id` to Jokic’s `personId` (`203999`).

After re-seeding, rebuild and **reload the Chrome extension** so `players.json` cannot drift from the database.

Name matching: lowercase, trim, collapse spaces, strip diacritics. `"Luka Doncic "`, `"luka  doncic"`, and `"Luka Dončić"` resolve to the same id.

## ESPN sample fixture

[`fixtures/game_logs_sample.csv`](fixtures/game_logs_sample.csv) is a **human-readable sample**, not a full season. Load it with `npm run seed`.

| Player | Team | NBA `player_id` | Games | Home | Away | Date range |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Nikola Jokic | DEN | 203999 | 12 | 8 | 4 | 2026-03-18 – 2026-04-12 |
| Shai Gilgeous-Alexander | OKC | 1628983 | 12 | 5 | 7 | 2026-03-17 – 2026-04-08 |

24 rows total. Each player has mixed home/away games and more than two opponents.

### Columns

Header row maps 1:1 to the seed importer:

```
player_id,player_name,team,game_date,opponent,venue,pts,reb,ast,source,source_game_id
```

| Column | Meaning |
| --- | --- |
| `player_id` | NBA `personId` (upsert key for `players.id`) |
| `player_name` | Player display name (unique `players.name`) |
| `team` | Player’s team abbreviation that night |
| `game_date` | Tip-off calendar date `YYYY-MM-DD` in America/New_York (how ESPN lists the game) |
| `opponent` | Opponent team abbreviation (ESPN’s codes; see note below) |
| `venue` | `home` or `away` |
| `pts`, `reb`, `ast` | Box-score points / rebounds / assists |
| `source` | Always `espn` in this fixture |
| `source_game_id` | ESPN event id (unique with player + source) |

### Source

Real 2025-26 NBA **regular-season** box scores from ESPN’s public JSON, not invented numbers.

- Athlete gamelog: `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/gamelog` (season filter `2026` = 2025-26)
  - Nikola Jokic, ESPN athlete id `3112335` (NBA `personId` `203999`)
  - Shai Gilgeous-Alexander, ESPN athlete id `4278073` (NBA `personId` `1628983`)
- Cross-checked against game summaries: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={id}` (`source_game_id` is that event id)

Last 12 regular-season appearances for each player in that season. ESPN opponent abbreviations are kept as returned (`GS`, `NY`, `SA`, `UTAH`, `WSH`, …) rather than remapped to NBA.com codes (`GSW`, `NYK`, `SAS`, `UTA`, `WAS`).

## Full-season dataset (not in git)

The untrimmed Kaggle dump is **not** committed. Put a larger file next to this tree if you want one locally, e.g. `apps/web/data/nba_game_logs.full.csv`. `*.full.csv` under `apps/web/data/` is gitignored.

The ESPN `npm run seed` importer accepts a path to any CSV in that column format. Default is the sample fixture.

### ESPN seed (CSV → Postgres)

From `apps/web`, with `DATABASE_URL` set (see `.env.example`):

```bash
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

Players are upserted by `players.id` (NBA `personId`; name and team are kept up to date). Game logs are upserted on `(playerId, source, sourceGameId)`, so a second run does **not** insert duplicates; box-score fields are refreshed from the CSV.

The script prints `Players upserted`, `Game logs inserted`, and `Game logs updated`. After a first load of this fixture you should see 2 players and 24 logs; a second run still has 24 logs (0 inserted, 24 updated).

### `--reset`

Deletes **all** `game_logs` then **all** `players` (Prisma Client `deleteMany`, in that order) before loading. Validation still runs first, so a bad CSV will not wipe the database.

```bash
npm run seed -- --reset
npm run seed -- --reset data/nba_game_logs.full.csv
```

`--reset` is destructive on the whole tables, not only rows present in the CSV.

Do not scrape HTML or download a full season in CI.
