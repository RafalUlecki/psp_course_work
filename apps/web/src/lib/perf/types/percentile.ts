export interface PercentileMsProps {
  samplesMs: readonly number[];
  percentile: number;
}

export interface LatencySummary {
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
}