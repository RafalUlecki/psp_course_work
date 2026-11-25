import type { DemoCsvSize, MachineConditions } from "./collectConditions";
import type { PerfFetch } from "./fetchLike";
import type { LatencySummary } from "./percentile";

export interface RunHitRatePerfProps {
  baseUrl: string;
  measuredCount: number;
  warmupCount: number;
  csvText: string;
  fetchImpl: PerfFetch;
  nowMs: () => number;
  measuredAt: Date;
  machine: MachineConditions;
  command: string;
}

export interface RunHitRatePerfSuccess {
  ok: true;
  report: string;
  summary: LatencySummary;
  authRequired: boolean;
  typicalPassed: boolean;
  csvSize: DemoCsvSize;
  playerGameCount: number;
}

export interface RunHitRatePerfFailure {
  ok: false;
  error: string;
}

export type RunHitRatePerfResult =
  | RunHitRatePerfSuccess
  | RunHitRatePerfFailure;