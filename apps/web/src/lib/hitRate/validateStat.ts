import type { StatKey } from "./types/computeHitRate";
import type {
  ValidateStatInput,
  ValidateStatFailure,
  ValidateStatResult,
} from "./types/validateStat";

const INVALID_STAT_ERROR = "Invalid stat. Allowed values: PTS, REB, AST.";

const invalidStat = (): ValidateStatFailure => ({
  ok: false,
  error: INVALID_STAT_ERROR,
});

const toStatKey = (value: string): StatKey | null => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "pts" || normalized === "reb" || normalized === "ast") {
    return normalized;
  }

  return null;
};

/**
 * Accepts only PTS, REB, or AST.
 *
 * Case policy: the input is trimmed and matched case-insensitively, so
 * `"PTS"`, `"pts"`, and `" Pts "` are all valid. On success the result uses
 * the lowercase `StatKey` (`"pts"` | `"reb"` | `"ast"`) that
 * `computeHitRate` expects. Invalid input (unknown strings, empty string,
 * non-strings such as `undefined`, `null`, or numbers) is returned as
 * `{ ok: false, error }` rather than thrown.
 */
export const validateStat = (stat: ValidateStatInput): ValidateStatResult => {
  if (typeof stat !== "string") {
    return invalidStat();
  }

  const normalized = toStatKey(stat);

  if (normalized === null) {
    return invalidStat();
  }

  return { ok: true, stat: normalized };
};
