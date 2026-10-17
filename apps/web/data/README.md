# Game-log data

Small fixture used to seed `players` / `game_logs` (schema in `apps/web/prisma/`). The PH-8 seed script is not in this change; it will read a CSV in the column format below.

## Fixture

[`fixtures/game_logs_sample.csv`](fixtures/game_logs_sample.csv) is a **human-readable sample**, not a full season:

| Player | Team | Games | Home | Away | Date range |
| --- | --- | ---: | ---: | ---: | --- |
| Nikola Jokic | DEN | 12 | 8 | 4 | 2026-03-18 – 2026-04-12 |
| Shai Gilgeous-Alexander | OKC | 12 | 5 | 7 | 2026-03-17 – 2026-04-08 |

24 rows total. Each player has mixed home/away games and more than two opponents.

## Columns

Header row maps 1:1 to the seed importer PH-8 will write:

```
player_name,team,game_date,opponent,venue,pts,reb,ast,source,source_game_id
```

| Column | Meaning |
| --- | --- |
| `player_name` | Player display name (upsert key for `players.name` in the future seed) |
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

The seed (PH-8) should accept a path to any CSV in the same column format, for example:

```bash
SEED_CSV_PATH=data/nba_game_logs.full.csv npm run seed
```

Default path should be this fixture. Do not scrape HTML or download a full season in CI.
