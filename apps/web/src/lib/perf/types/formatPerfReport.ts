import type { DemoCsvSize, MachineConditions } from "./collectConditions";
import type { LatencySummary } from "./percentile";

export interface FormatPerfReportProps {
  measuredAt: Date;
  command: string;
  baseUrl: string;
  measuredCount: number;
  warmupCount: number;
  authRequired: boolean;
  loginEmail: string | null;
  playerId: number;
  playerGameCount: number;
  csvSize: DemoCsvSize;
  machine: MachineConditions;
  summary: LatencySummary;
  targetMs: number;
}