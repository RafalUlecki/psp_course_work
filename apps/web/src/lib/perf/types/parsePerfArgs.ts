export interface PerfArgs {
  baseUrl: string;
  measuredCount: number;
  warmupCount: number;
  writeReport: boolean;
}

export interface ParsePerfArgsEnv {
  PERF_BASE_URL?: string;
  PERF_N?: string;
  PERF_WARMUP?: string;
}

export interface ParsePerfArgsProps {
  argv: readonly string[];
  env: ParsePerfArgsEnv;
}

export interface ParsePerfArgsSuccess {
  ok: true;
  args: PerfArgs;
}

export interface ParsePerfArgsFailure {
  ok: false;
  error: string;
}

export type ParsePerfArgsResult = ParsePerfArgsSuccess | ParsePerfArgsFailure;