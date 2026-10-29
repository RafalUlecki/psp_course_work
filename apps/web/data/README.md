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
npm run seed:demo
```

`npm run seed:demo` with no `--players` seeds **all** players in the CSV. Pass `--players "Luka Doncic,Austin Reaves"` only if you want a smaller subset. The command:

1. Reads only the committed CSV (no network).
2. Fails and names the player when a requested `--players` name is not in the CSV.
3. Upserts `players` by `personId` and game logs by `(playerId, source, sourceGameId)` (idempotent; insert order does not change ids).
4. Writes `apps/extension/players.json` (normalized name → player id) from the seeded set.

After re-seeding, rebuild and **reload the Chrome extension** so `players.json` cannot drift from the database.

Name matching: lowercase, trim, collapse spaces, strip diacritics. `"Luka Doncic "`, `"luka  doncic"`, and `"Luka Dončić"` resolve to the same id.

`prisma db seed` runs the same script (`prisma.seed` → `seed:demo`).
