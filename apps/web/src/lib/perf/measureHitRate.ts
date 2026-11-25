import { buildHitRateUrl, lineForRequestIndex } from "./buildHitRateUrl";
import {
  PERF_LAST_N,
  PERF_PLAYER_ID,
  PERF_PLAYER_LOG_COUNT_LAST_N,
  PERF_STAT,
} from "./constants";
import {
  HIT_RATE_BODY_INVALID_ERROR,
  HIT_RATE_REQUEST_FAILED_ERROR,
} from "./errors";
import { parseHitRateSuccessBody } from "./parseHitRateSuccessBody";
import { timedFetch } from "./timedFetch";
import type {
  MeasureHitRateProps,
  MeasureHitRateResult,
} from "./types/measureHitRate";

interface FetchHitRateProps {
  baseUrl: string;
  index: number;
  lastN: number;
  token: string | null;
  fetchImpl: MeasureHitRateProps["fetchImpl"];
  nowMs: () => number;
}

const fetchHitRate = async (props: FetchHitRateProps) => {
  const { baseUrl, index, lastN, token, fetchImpl, nowMs } = props;
  const url = buildHitRateUrl({
    baseUrl,
    playerId: PERF_PLAYER_ID,
    stat: PERF_STAT,
    line: lineForRequestIndex({ index }),
    lastN,
  });
  const timed = await timedFetch({ url, token, fetchImpl, nowMs });
  if (!timed.ok) {
    return timed;
  }
  if (timed.status !== 200) {
    return {
      ok: false as const,
      error: `${HIT_RATE_REQUEST_FAILED_ERROR} HTTP ${timed.status}`,
    };
  }
  const body = parseHitRateSuccessBody(timed.bodyText);
  if (body === null) {
    return { ok: false as const, error: HIT_RATE_BODY_INVALID_ERROR };
  }
  return {
    ok: true as const,
    elapsedMs: timed.elapsedMs,
    n: body.n,
  };
};

export const measureHitRate = async (
  props: MeasureHitRateProps,
): Promise<MeasureHitRateResult> => {
  const { baseUrl, measuredCount, warmupCount, token, fetchImpl, nowMs } = props;

  const countResult = await fetchHitRate({
    baseUrl,
    index: 0,
    lastN: PERF_PLAYER_LOG_COUNT_LAST_N,
    token,
    fetchImpl,
    nowMs,
  });
  if (!countResult.ok) {
    return countResult;
  }

  const samplesMs: number[] = [];
  const totalRequests = warmupCount + measuredCount;

  for (let index = 0; index < totalRequests; index += 1) {
    const result = await fetchHitRate({
      baseUrl,
      index,
      lastN: PERF_LAST_N,
      token,
      fetchImpl,
      nowMs,
    });
    if (!result.ok) {
      return result;
    }
    if (index >= warmupCount) {
      samplesMs.push(result.elapsedMs);
    }
  }

  return {
    ok: true,
    samplesMs,
    playerGameCount: countResult.n,
  };
};