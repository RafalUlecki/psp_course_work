import type { PerfFetch } from "./fetchLike";

export interface ProbeHitRateAuthProps {
  baseUrl: string;
  fetchImpl: PerfFetch;
}

export interface ProbeHitRateAuthSuccess {
  ok: true;
  authRequired: boolean;
}

export interface ProbeHitRateAuthFailure {
  ok: false;
  error: string;
}

export type ProbeHitRateAuthResult =
  | ProbeHitRateAuthSuccess
  | ProbeHitRateAuthFailure;