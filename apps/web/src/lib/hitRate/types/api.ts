import type { Venue } from "@prisma/client";
import type { StatKey } from "./computeHitRate";

/**
 * GET /api/hit-rate query string.
 *
 * Required: playerId, stat (PTS/REB/AST via validateStat), line (finite number).
 * Optional: lastN (positive integer), opponent, venue ("home" | "away").
 */
export interface HitRateQueryParams {
  playerId: string;
  stat: string;
  line: string;
  lastN?: string;
  opponent?: string;
  venue?: string;
}

/**
 * Parsed GET /api/hit-rate request after validation.
 */
export interface HitRateRequest {
  playerId: string;
  stat: StatKey;
  line: number;
  lastN?: number;
  opponent?: string;
  venue?: Venue;
}

/**
 * Echo of optional filters that were applied. Omitted keys were not provided.
 */
export interface HitRateFilters {
  lastN?: number;
  opponent?: string;
  venue?: Venue;
}

/**
 * One game from the sample used to compute hit rate (newest first).
 * `value` is the selected stat so the extension slider can recompute other lines.
 */
export interface HitRateGame {
  gameDate: string;
  opponent: string;
  venue: Venue;
  value: number;
}

/**
 * JSON body for GET /api/hit-rate on HTTP 200.
 *
 * Empty-result shape: when no games remain after filtering, the handler still
 * returns HTTP 200 with `hitRate: null`, `hits: 0`, `n: 0`, and `games: []`,
 * plus the echoed `playerId`, `stat`, `line`, and `filters`. This is a valid
 * response (not 404/400) so clients can show "not enough data".
 *
 * Otherwise `games` is the filtered list newest-first, each with
 * `{ gameDate (ISO string), opponent, venue, value }`.
 */
export interface HitRateSuccessResponse {
  playerId: string;
  stat: StatKey;
  line: number;
  filters: HitRateFilters;
  hitRate: number | null;
  hits: number;
  n: number;
  games: HitRateGame[];
}

/**
 * JSON body for GET /api/hit-rate on HTTP 400.
 */
export interface HitRateErrorResponse {
  error: string;
}

export interface HitRateSuccessHttpResult {
  status: 200;
  body: HitRateSuccessResponse;
}

export interface HitRateErrorHttpResult {
  status: 400;
  body: HitRateErrorResponse;
}

export type HitRateHttpResult = HitRateSuccessHttpResult | HitRateErrorHttpResult;
