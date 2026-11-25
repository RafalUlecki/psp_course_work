# Hit-rate response time (našumas)

Stage I quality attribute: **Našumas** (response time).
Success criterion: typical response **< 300 ms** with prepared logs (one player, last 10 games, points, line changed several times as the slider does).

This file is a snapshot of one measured run. Re-run the command below against a live Compose stack and compare; do not edit the numbers by hand.

## How to reproduce

1. From the repo root: `cp .env.example .env && docker compose up --build`
2. `cd apps/web && npm run perf`

The script uses plain Node `fetch` and `performance.now()` (no paid tools). Requests are **sequential** (one in-flight at a time), matching a person moving the line slider — not a multi-user load test.

## Conditions (this run)

| Item | Value |
|------|-------|
| Measured at | 2026-11-25T11:30:30.148Z |
| Machine | cursor · linux 6.12.113+ (x64) |
| CPU | 4 × Intel(R) Xeon(R) Processor |
| Memory | 15.6 GiB |
| API | http://localhost:3000 (Docker Compose production Next.js) |
| Auth | on (unauthenticated GET returned 401; timed requests used Bearer token from POST /api/auth/login as admin-a@prophover.local) |
| Player | `203999` Nikola Jokic (demo seed) |
| Query | `stat=pts`, `lastN=10`, `line` cycling 14.5–34.5 in steps of 0.5 |
| Warm-up excluded | 10 requests |
| Measured N | 200 |
| Data size | demo CSV `apps/web/data/PlayerStatistics.csv`: 26648 game-log rows, 582 players; player 203999 had 65 logs in the API (requested lastN=100000) |
| Game-log index | @@index([playerId, gameDate]) — yes — present in the Prisma schema. Source: apps/web/prisma/schema.prisma (model GameLog) and apps/web/prisma/migrations/20261016080905_init/migration.sql (`game_logs_player_id_game_date_idx`) |
| Cache | none (first version; hit-rate is computed per request) |

## Design choice under test

Hit-rate is **computed on the server**: `GET /api/hit-rate` loads that player's game logs from Postgres, filters last N in process, then counts hits vs the line. There is **no hit-rate cache** in this version.

Game logs are indexed by `(player_id, game_date)`: @@index([playerId, gameDate]) on `GameLog`. This index **does** exist in the Prisma schema (checked in apps/web/prisma/schema.prisma (model GameLog) and apps/web/prisma/migrations/20261016080905_init/migration.sql (`game_logs_player_id_game_date_idx`)); this report does not silently claim an index that is missing from the schema.

## Results

| Metric | Value | vs < 300 ms |
|--------|-------|---------------------|
| p50 (typical) | 4.11 ms | PASS |
| p95 | 4.92 ms | PASS |
| max | 15.97 ms | PASS |

**Verdict: PASS** — typical response (p50) is 4.11 ms vs the Stage I target of < 300 ms.
