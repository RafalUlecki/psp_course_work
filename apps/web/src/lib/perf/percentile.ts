import { EMPTY_SAMPLES_ERROR } from "./errors";
import type { LatencySummary, PercentileMsProps } from "./types/percentile";

export const percentileMs = (props: PercentileMsProps): number => {
  const { samplesMs, percentile } = props;
  const sorted = [...samplesMs].sort((left, right) => left - right);

  if (sorted.length === 0) {
    throw new Error(EMPTY_SAMPLES_ERROR);
  }

  const rank = Math.ceil((percentile / 100) * sorted.length);
  const index = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[index] ?? sorted[sorted.length - 1];
};

export const summarizeLatencies = (
  samplesMs: readonly number[],
): LatencySummary => ({
  p50Ms: percentileMs({ samplesMs, percentile: 50 }),
  p95Ms: percentileMs({ samplesMs, percentile: 95 }),
  maxMs: percentileMs({ samplesMs, percentile: 100 }),
});