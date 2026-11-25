import { buildHitRateUrl } from "./buildHitRateUrl";
import {
  PERF_FIXTURE_LINE,
  PERF_LAST_N,
  PERF_PLAYER_ID,
  PERF_STAT,
} from "./constants";
import { AUTH_PROBE_FAILED_ERROR } from "./errors";
import type {
  ProbeHitRateAuthProps,
  ProbeHitRateAuthResult,
} from "./types/probeHitRateAuth";

export const probeHitRateAuth = async (
  props: ProbeHitRateAuthProps,
): Promise<ProbeHitRateAuthResult> => {
  const { baseUrl, fetchImpl } = props;
  const url = buildHitRateUrl({
    baseUrl,
    playerId: PERF_PLAYER_ID,
    stat: PERF_STAT,
    line: PERF_FIXTURE_LINE,
    lastN: PERF_LAST_N,
  });

  const response = await fetchImpl(url);

  if (response.status === 401) {
    return { ok: true, authRequired: true };
  }
  if (response.status === 200) {
    return { ok: true, authRequired: false };
  }

  return {
    ok: false,
    error: `${AUTH_PROBE_FAILED_ERROR} HTTP ${response.status}`,
  };
};