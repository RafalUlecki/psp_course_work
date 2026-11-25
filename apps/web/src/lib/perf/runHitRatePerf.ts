import { countDemoCsvSize } from "./collectConditions";
import { isUnderTargetMs } from "./compareToTarget";
import {
  PERF_COMMAND,
  PERF_LOGIN_EMAIL,
  PERF_PLAYER_ID,
  PERF_TARGET_MS,
} from "./constants";
import { formatPerfReport } from "./formatPerfReport";
import { loginDemoUser } from "./loginDemoUser";
import { measureHitRate } from "./measureHitRate";
import { summarizeLatencies } from "./percentile";
import { probeHitRateAuth } from "./probeHitRateAuth";
import type {
  RunHitRatePerfProps,
  RunHitRatePerfResult,
} from "./types/runHitRatePerf";

export const runHitRatePerf = async (
  props: RunHitRatePerfProps,
): Promise<RunHitRatePerfResult> => {
  const {
    baseUrl,
    measuredCount,
    warmupCount,
    csvText,
    fetchImpl,
    nowMs,
    measuredAt,
    machine,
    command,
  } = props;

  const probe = await probeHitRateAuth({ baseUrl, fetchImpl });
  if (!probe.ok) {
    return probe;
  }

  let token: string | null = null;
  if (probe.authRequired) {
    const login = await loginDemoUser({ baseUrl, fetchImpl });
    if (!login.ok) {
      return login;
    }
    token = login.token;
  }

  const measured = await measureHitRate({
    baseUrl,
    measuredCount,
    warmupCount,
    token,
    fetchImpl,
    nowMs,
  });
  if (!measured.ok) {
    return measured;
  }

  const summary = summarizeLatencies(measured.samplesMs);
  const csvSize = countDemoCsvSize({ csvText });
  const typicalPassed = isUnderTargetMs({
    valueMs: summary.p50Ms,
    targetMs: PERF_TARGET_MS,
  });
  const report = formatPerfReport({
    measuredAt,
    command: command === "" ? PERF_COMMAND : command,
    baseUrl,
    measuredCount,
    warmupCount,
    authRequired: probe.authRequired,
    loginEmail: probe.authRequired ? PERF_LOGIN_EMAIL : null,
    playerId: PERF_PLAYER_ID,
    playerGameCount: measured.playerGameCount,
    csvSize,
    machine,
    summary,
    targetMs: PERF_TARGET_MS,
  });

  return {
    ok: true,
    report,
    summary,
    authRequired: probe.authRequired,
    typicalPassed,
    csvSize,
    playerGameCount: measured.playerGameCount,
  };
};