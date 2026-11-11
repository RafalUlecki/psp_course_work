import { z } from "zod";

import { DEFAULT_TRENDING_LIMIT, MAX_TRENDING_LIMIT } from "./constants";
import { INVALID_TRENDING_LIMIT_ERROR } from "./errors";
import type {
  ParseTrendingLimitProps,
  ParseTrendingLimitResult,
} from "./types/parseTrendingLimit";

const trendingLimitSchema = z.coerce
  .number({ error: INVALID_TRENDING_LIMIT_ERROR })
  .int(INVALID_TRENDING_LIMIT_ERROR)
  .min(1, INVALID_TRENDING_LIMIT_ERROR)
  .max(MAX_TRENDING_LIMIT, INVALID_TRENDING_LIMIT_ERROR);

const firstZodErrorMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? INVALID_TRENDING_LIMIT_ERROR;

export const parseTrendingLimit = (
  props: ParseTrendingLimitProps,
): ParseTrendingLimitResult => {
  const { searchParams } = props;
  const raw = searchParams.get("limit");

  if (raw === null || raw.trim() === "") {
    return { ok: true, limit: DEFAULT_TRENDING_LIMIT };
  }

  const parsed = trendingLimitSchema.safeParse(raw.trim());

  if (!parsed.success) {
    return { ok: false, error: firstZodErrorMessage(parsed.error) };
  }

  return { ok: true, limit: parsed.data };
};
