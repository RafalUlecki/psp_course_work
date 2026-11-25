import {
  PERF_FIXTURE_LINE,
  PERF_HIT_RATE_PATH,
  PERF_LINE_RANGE,
  PERF_LINE_STEP,
} from "./constants";
import type {
  BuildHitRateUrlProps,
  LineForRequestIndexProps,
} from "./types/buildHitRateUrl";

const sliderLineCount = (): number =>
  Math.round((2 * PERF_LINE_RANGE) / PERF_LINE_STEP) + 1;

export const lineForRequestIndex = (props: LineForRequestIndexProps): number => {
  const { index } = props;
  const count = sliderLineCount();
  const offset = ((index % count) + count) % count;
  const raw = PERF_FIXTURE_LINE - PERF_LINE_RANGE + offset * PERF_LINE_STEP;
  return Math.round(raw * 10) / 10;
};

export const buildHitRateUrl = (props: BuildHitRateUrlProps): string => {
  const { baseUrl, playerId, stat, line, lastN } = props;
  const url = new URL(PERF_HIT_RATE_PATH, baseUrl);
  url.searchParams.set("playerId", String(playerId));
  url.searchParams.set("stat", stat);
  url.searchParams.set("line", String(line));
  url.searchParams.set("lastN", String(lastN));
  return url.toString();
};