import { DEV_USERS } from "../auth/devUsers";

export const PERF_HIT_RATE_PATH = "/api/hit-rate";
export const PERF_LOGIN_PATH = "/api/auth/login";
export const PERF_DEFAULT_BASE_URL = "http://localhost:3000";
export const PERF_DEFAULT_MEASURED_COUNT = 200;
export const PERF_DEFAULT_WARMUP_COUNT = 10;
export const PERF_TARGET_MS = 300;
export const PERF_STAT = "pts";
export const PERF_LAST_N = 10;
export const PERF_PLAYER_ID = 203999;
export const PERF_PLAYER_LABEL = "Nikola Jokic (demo seed)";
export const PERF_FIXTURE_LINE = 24.5;
export const PERF_LINE_STEP = 0.5;
export const PERF_LINE_RANGE = 10;
export const PERF_PLAYER_LOG_COUNT_LAST_N = 100_000;
export const PERF_REPORT_RELATIVE_PATH =
  "docs/performance/hit-rate-response-time.md";
export const PERF_COMMAND = "cd apps/web && npm run perf";

export const GAME_LOG_PLAYER_DATE_INDEX = "@@index([playerId, gameDate])";
export const GAME_LOG_PLAYER_DATE_INDEX_EXISTS_IN_SCHEMA = true;
export const GAME_LOG_PLAYER_DATE_INDEX_SOURCE =
  "apps/web/prisma/schema.prisma (model GameLog) and apps/web/prisma/migrations/20261016080905_init/migration.sql (`game_logs_player_id_game_date_idx`)";

const adminA = DEV_USERS.find(
  (user) => user.email === "admin-a@prophover.local",
);

export const PERF_LOGIN_EMAIL = adminA?.email ?? "admin-a@prophover.local";
export const PERF_LOGIN_PASSWORD = adminA?.password ?? "password-admin-a";