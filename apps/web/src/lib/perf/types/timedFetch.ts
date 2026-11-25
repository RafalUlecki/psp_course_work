import type { PerfFetch } from "./fetchLike";

export interface TimedFetchProps {
  url: string;
  token: string | null;
  fetchImpl: PerfFetch;
  nowMs: () => number;
}

export interface TimedFetchSuccess {
  ok: true;
  elapsedMs: number;
  status: number;
  bodyText: string;
}

export interface TimedFetchFailure {
  ok: false;
  error: string;
}

export type TimedFetchResult = TimedFetchSuccess | TimedFetchFailure;