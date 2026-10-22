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
