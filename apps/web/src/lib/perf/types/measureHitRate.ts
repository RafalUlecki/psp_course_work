import type { PerfFetch } from "./fetchLike";

export interface MeasureHitRateProps {
  baseUrl: string;
  measuredCount: number;
  warmupCount: number;
  token: string | null;
  fetchImpl: PerfFetch;
  nowMs: () => number;
}

export interface MeasureHitRateSuccess {
  ok: true;
  samplesMs: number[];
  playerGameCount: number;
}

export interface MeasureHitRateFailure {
  ok: false;
  error: string;
}

export type MeasureHitRateResult =
  | MeasureHitRateSuccess
  | MeasureHitRateFailure;