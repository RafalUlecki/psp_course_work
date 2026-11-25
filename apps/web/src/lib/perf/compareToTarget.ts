import { PERF_TARGET_MS } from "./constants";
import type { IsUnderTargetMsProps } from "./types/compareToTarget";

export const isUnderTargetMs = (props: IsUnderTargetMsProps): boolean => {
  const { valueMs, targetMs = PERF_TARGET_MS } = props;
  return valueMs < targetMs;
};