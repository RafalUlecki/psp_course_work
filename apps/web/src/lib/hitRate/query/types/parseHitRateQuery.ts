import type { HitRateRequest } from "../../types/api";

export interface ParseHitRateQueryProps {
  searchParams: URLSearchParams;
}

export interface ParseHitRateQuerySuccess {
  ok: true;
  request: HitRateRequest;
}

export interface ParseHitRateQueryFailure {
  ok: false;
  error: string;
}

export type ParseHitRateQueryResult =
  | ParseHitRateQuerySuccess
  | ParseHitRateQueryFailure;
