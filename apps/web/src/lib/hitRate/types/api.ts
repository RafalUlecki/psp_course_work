import type { Venue } from "@prisma/client";
import type { StatKey } from "./computeHitRate";

export interface HitRateRequest {
  playerId: string;
  stat: StatKey;
  line: number;
  lastN?: number;
  opponent?: string;
  venue?: Venue;
}

export interface HitRateFilters {
  lastN?: number;
  opponent?: string;
  venue?: Venue;
}

export interface HitRateGame {
  gameDate: string;
  opponent: string;
  venue: Venue;
  value: number;
}

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
