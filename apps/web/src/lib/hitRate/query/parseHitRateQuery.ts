import { z } from "zod";
import {
  HitRateQueryParam,
  type NormalizedHitRateQuery,
} from "./hitRateQueryParam";
import { hitRateQuerySchema } from "./hitRateQuerySchema";
import type {
  ParseHitRateQueryProps,
  ParseHitRateQueryResult,
} from "./types/parseHitRateQuery";

const normalizeQueryParam = (
  searchParams: URLSearchParams,
  key: HitRateQueryParam,
): string | undefined => {
  const value = searchParams.get(key);

  if (value === null) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return undefined;
  }

  return trimmed;
};

const normalizedHitRateQueryFromSearchParams = (
  searchParams: URLSearchParams,
): NormalizedHitRateQuery => ({
  playerId: normalizeQueryParam(searchParams, HitRateQueryParam.playerId),
  stat: normalizeQueryParam(searchParams, HitRateQueryParam.stat),
  line: normalizeQueryParam(searchParams, HitRateQueryParam.line),
  lastN: normalizeQueryParam(searchParams, HitRateQueryParam.lastN),
  opponent: normalizeQueryParam(searchParams, HitRateQueryParam.opponent),
  venue: normalizeQueryParam(searchParams, HitRateQueryParam.venue),
});

const firstZodErrorMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? "Invalid request.";

export const parseHitRateQuery = (
  props: ParseHitRateQueryProps,
): ParseHitRateQueryResult => {
  const { searchParams } = props;
  const query = normalizedHitRateQueryFromSearchParams(searchParams);
  const parsed = hitRateQuerySchema.safeParse(query);

  if (!parsed.success) {
    return { ok: false, error: firstZodErrorMessage(parsed.error) };
  }

  return { ok: true, request: parsed.data };
};
