export const EMPTY_SAMPLES_ERROR = "No measured samples.";
export const INVALID_MEASURED_COUNT_ERROR =
  "--n must be a positive integer.";
export const INVALID_WARMUP_COUNT_ERROR =
  "--warmup must be a non-negative integer.";
export const MISSING_BASE_URL_VALUE_ERROR = "--base-url requires a value.";
export const MISSING_N_VALUE_ERROR = "--n requires a value.";
export const MISSING_WARMUP_VALUE_ERROR = "--warmup requires a value.";
export const UNKNOWN_PERF_ARG_ERROR = "Unknown argument.";
export const AUTH_PROBE_FAILED_ERROR =
  "Could not probe /api/hit-rate without a token.";
export const LOGIN_FAILED_ERROR =
  "Demo login failed; cannot time /api/hit-rate while AUTH_REQUIRED is on.";
export const HIT_RATE_REQUEST_FAILED_ERROR = "Hit-rate request failed.";
export const HIT_RATE_BODY_INVALID_ERROR =
  "Hit-rate response was not a success JSON body.";
export const LOGIN_BODY_INVALID_ERROR = "Login response did not include a token.";