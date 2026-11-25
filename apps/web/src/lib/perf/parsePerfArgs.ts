import {
  PERF_DEFAULT_BASE_URL,
  PERF_DEFAULT_MEASURED_COUNT,
  PERF_DEFAULT_WARMUP_COUNT,
} from "./constants";
import {
  INVALID_MEASURED_COUNT_ERROR,
  INVALID_WARMUP_COUNT_ERROR,
  MISSING_BASE_URL_VALUE_ERROR,
  MISSING_N_VALUE_ERROR,
  MISSING_WARMUP_VALUE_ERROR,
  UNKNOWN_PERF_ARG_ERROR,
} from "./errors";
import type {
  ParsePerfArgsProps,
  ParsePerfArgsResult,
  PerfArgs,
} from "./types/parsePerfArgs";

const parsePositiveInt = (raw: string): number | null => {
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    return null;
  }
  return value;
};

const parseNonNegativeInt = (raw: string): number | null => {
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
};

const envMeasuredCount = (raw: string | undefined): number => {
  if (raw === undefined) {
    return PERF_DEFAULT_MEASURED_COUNT;
  }
  return parsePositiveInt(raw) ?? PERF_DEFAULT_MEASURED_COUNT;
};

const envWarmupCount = (raw: string | undefined): number => {
  if (raw === undefined) {
    return PERF_DEFAULT_WARMUP_COUNT;
  }
  return parseNonNegativeInt(raw) ?? PERF_DEFAULT_WARMUP_COUNT;
};

export const parsePerfArgs = (props: ParsePerfArgsProps): ParsePerfArgsResult => {
  const { argv, env } = props;
  const args: PerfArgs = {
    baseUrl: env.PERF_BASE_URL?.trim() || PERF_DEFAULT_BASE_URL,
    measuredCount: envMeasuredCount(env.PERF_N),
    warmupCount: envWarmupCount(env.PERF_WARMUP),
    writeReport: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write") {
      args.writeReport = true;
      continue;
    }
    if (arg === "--base-url") {
      const value = argv[index + 1];
      if (value === undefined) {
        return { ok: false, error: MISSING_BASE_URL_VALUE_ERROR };
      }
      args.baseUrl = value;
      index += 1;
      continue;
    }
    if (arg === "--n") {
      const value = argv[index + 1];
      if (value === undefined) {
        return { ok: false, error: MISSING_N_VALUE_ERROR };
      }
      const parsed = parsePositiveInt(value);
      if (parsed === null) {
        return { ok: false, error: INVALID_MEASURED_COUNT_ERROR };
      }
      args.measuredCount = parsed;
      index += 1;
      continue;
    }
    if (arg === "--warmup") {
      const value = argv[index + 1];
      if (value === undefined) {
        return { ok: false, error: MISSING_WARMUP_VALUE_ERROR };
      }
      const parsed = parseNonNegativeInt(value);
      if (parsed === null) {
        return { ok: false, error: INVALID_WARMUP_COUNT_ERROR };
      }
      args.warmupCount = parsed;
      index += 1;
      continue;
    }
    return { ok: false, error: `${UNKNOWN_PERF_ARG_ERROR} ${arg}` };
  }

  return { ok: true, args };
};