import { isUnderTargetMs } from "./compareToTarget";
import {
  GAME_LOG_PLAYER_DATE_INDEX,
  GAME_LOG_PLAYER_DATE_INDEX_EXISTS_IN_SCHEMA,
  GAME_LOG_PLAYER_DATE_INDEX_SOURCE,
  PERF_FIXTURE_LINE,
  PERF_LAST_N,
  PERF_LINE_RANGE,
  PERF_LINE_STEP,
  PERF_PLAYER_LABEL,
  PERF_PLAYER_LOG_COUNT_LAST_N,
  PERF_STAT,
} from "./constants";
import type { FormatPerfReportProps } from "./types/formatPerfReport";

const formatMs = (valueMs: number): string => `${valueMs.toFixed(2)} ms`;

const formatGiB = (bytes: number): string =>
  `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GiB`;

const passFail = (valueMs: number, targetMs: number): string =>
  isUnderTargetMs({ valueMs, targetMs }) ? "PASS" : "FAIL";

const authLabel = (props: {
  authRequired: boolean;
  loginEmail: string | null;
}): string => {
  const { authRequired, loginEmail } = props;
  if (!authRequired) {
    return "off (unauthenticated GET /api/hit-rate returned 200)";
  }
  const email = loginEmail ?? "demo user";
  return `on (unauthenticated GET returned 401; timed requests used Bearer token from POST /api/auth/login as ${email})`;
};

export const formatPerfReport = (props: FormatPerfReportProps): string => {
  const {
    measuredAt,
    command,
    baseUrl,
    measuredCount,
    warmupCount,
    authRequired,
    loginEmail,
    playerId,
    playerGameCount,
    csvSize,
    machine,
    summary,
    targetMs,
  } = props;

  const typicalPass = isUnderTargetMs({ valueMs: summary.p50Ms, targetMs });
  const verdict = typicalPass ? "PASS" : "FAIL";
  const indexExists = GAME_LOG_PLAYER_DATE_INDEX_EXISTS_IN_SCHEMA
    ? "yes — present in the Prisma schema"
    : "no — not present in the Prisma schema (do not assume it exists at runtime)";
  const minLine = PERF_FIXTURE_LINE - PERF_LINE_RANGE;
  const maxLine = PERF_FIXTURE_LINE + PERF_LINE_RANGE;

  return `# Hit-rate response time (našumas)

Stage I quality attribute: **Našumas** (response time).
Success criterion: typical response **< ${targetMs} ms** with prepared logs (one player, last ${PERF_LAST_N} games, points, line changed several times as the slider does).

This file is a snapshot of one measured run. Re-run the command below against a live Compose stack and compare; do not edit the numbers by hand.

## How to reproduce

1. From the repo root: \`cp .env.example .env && docker compose up --build\`
2. \`${command}\`

The script uses plain Node \`fetch\` and \`performance.now()\` (no paid tools). Requests are **sequential** (one in-flight at a time), matching a person moving the line slider — not a multi-user load test.

## Conditions (this run)

| Item | Value |
|------|-------|
| Measured at | ${measuredAt.toISOString()} |
| Machine | ${machine.hostname} · ${machine.platform} ${machine.release} (${machine.arch}) |
| CPU | ${machine.cpuCount} × ${machine.cpuModel} |
| Memory | ${formatGiB(machine.totalMemoryBytes)} |
| API | ${baseUrl} (Docker Compose production Next.js) |
| Auth | ${authLabel({ authRequired, loginEmail })} |
| Player | \`${playerId}\` ${PERF_PLAYER_LABEL} |
| Query | \`stat=${PERF_STAT}\`, \`lastN=${PERF_LAST_N}\`, \`line\` cycling ${minLine}–${maxLine} in steps of ${PERF_LINE_STEP} |
| Warm-up excluded | ${warmupCount} requests |
| Measured N | ${measuredCount} |
| Data size | demo CSV \`apps/web/data/PlayerStatistics.csv\`: ${csvSize.csvRowCount} game-log rows, ${csvSize.csvPlayerCount} players; player ${playerId} had ${playerGameCount} logs in the API (requested lastN=${PERF_PLAYER_LOG_COUNT_LAST_N}) |
| Game-log index | ${GAME_LOG_PLAYER_DATE_INDEX} — ${indexExists}. Source: ${GAME_LOG_PLAYER_DATE_INDEX_SOURCE} |
| Cache | none (first version; hit-rate is computed per request) |

## Design choice under test

Hit-rate is **computed on the server**: \`GET /api/hit-rate\` loads that player's game logs from Postgres, filters last N in process, then counts hits vs the line. There is **no hit-rate cache** in this version.

Game logs are indexed by \`(player_id, game_date)\`: ${GAME_LOG_PLAYER_DATE_INDEX} on \`GameLog\`. This index **does** exist in the Prisma schema (checked in ${GAME_LOG_PLAYER_DATE_INDEX_SOURCE}); this report does not silently claim an index that is missing from the schema.

## Results

| Metric | Value | vs < ${targetMs} ms |
|--------|-------|---------------------|
| p50 (typical) | ${formatMs(summary.p50Ms)} | ${passFail(summary.p50Ms, targetMs)} |
| p95 | ${formatMs(summary.p95Ms)} | ${passFail(summary.p95Ms, targetMs)} |
| max | ${formatMs(summary.maxMs)} | ${passFail(summary.maxMs, targetMs)} |

**Verdict: ${verdict}** — typical response (p50) is ${formatMs(summary.p50Ms)} vs the Stage I target of < ${targetMs} ms.
`;
};