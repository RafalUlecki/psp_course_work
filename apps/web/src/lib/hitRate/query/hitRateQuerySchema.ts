import { Venue } from "@prisma/client";
import { z } from "zod";
import {
  INVALID_LAST_N_ERROR,
  INVALID_LINE_ERROR,
  INVALID_STAT_ERROR,
  INVALID_VENUE_ERROR,
  MISSING_LINE_ERROR,
  MISSING_PLAYER_ID_ERROR,
} from "./errors";
import type { HitRateRequest } from "../types/api";

const statSearchParamSchema = z
  .string({ error: INVALID_STAT_ERROR })
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z.union([z.literal("pts"), z.literal("reb"), z.literal("ast")], {
      error: INVALID_STAT_ERROR,
    }),
  );

const lineSearchParamSchema = z
  .string({ error: MISSING_LINE_ERROR })
  .pipe(z.coerce.number({ error: INVALID_LINE_ERROR }))
  .refine((value) => Number.isFinite(value), { message: INVALID_LINE_ERROR });

const lastNSearchParamSchema = z.optional(
  z.coerce
    .number({ error: INVALID_LAST_N_ERROR })
    .int(INVALID_LAST_N_ERROR)
    .positive(INVALID_LAST_N_ERROR),
);

const venueSearchParamSchema = z
  .enum([Venue.home, Venue.away], { error: INVALID_VENUE_ERROR })
  .optional();

const hitRateQueryObjectSchema = z.object({
  playerId: z.string({ error: MISSING_PLAYER_ID_ERROR }),
  stat: statSearchParamSchema,
  line: lineSearchParamSchema,
  lastN: lastNSearchParamSchema,
  venue: venueSearchParamSchema,
  opponent: z.string().optional(),
});

type ParsedHitRateQueryFields = z.output<typeof hitRateQueryObjectSchema>;

const toHitRateRequest = (fields: ParsedHitRateQueryFields): HitRateRequest => {
  const { playerId, stat, line, lastN, venue, opponent } = fields;

  return {
    playerId,
    stat,
    line,
    ...(lastN === undefined ? {} : { lastN }),
    ...(opponent === undefined ? {} : { opponent }),
    ...(venue === undefined ? {} : { venue }),
  };
};

export const hitRateQuerySchema = hitRateQueryObjectSchema.transform(
  (parsedFields: ParsedHitRateQueryFields) => toHitRateRequest(parsedFields),
);
