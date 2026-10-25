import type { GameVenue } from "../../gameLogs/types/playerGame";
import type { StatKey } from "./computeHitRate";

export interface HitRateRequest {
  playerId: number;
  stat: StatKey;
  line: number;
  /** Defaults to 10 when omitted. */
  lastN?: number;
  opponent?: string;
  venue?: GameVenue;
}

export interface HitRateFilters {
  lastN?: number;
  opponent?: string;
  venue?: GameVenue;
}

export interface HitRateGame {
  gameDate: string;
  opponent: string;
  venue: GameVenue;
  value: number;
}

export interface HitRateSuccessResponse {
  playerId: number;
  stat: StatKey;
  line: number;
  filters: HitRateFilters;
  hitRate: number | null;
  hits: number;
  n: number;
  games: HitRateGame[];
}

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

export type HitRateHttpResult =
  | HitRateSuccessHttpResult
  | HitRateErrorHttpResult;
