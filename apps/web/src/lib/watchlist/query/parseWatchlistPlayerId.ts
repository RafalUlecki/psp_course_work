import { z } from "zod";

import {
  INVALID_JSON_BODY_ERROR,
  INVALID_PLAYER_ID_ERROR,
  MISSING_PLAYER_ID_ERROR,
} from "../errors";
import type {
  ParseWatchlistPlayerIdBodyProps,
  ParseWatchlistPlayerIdQueryProps,
  ParseWatchlistPlayerIdResult,
} from "../types/parseWatchlistPlayerId";

const playerIdNumberSchema = z.coerce
  .number({ error: INVALID_PLAYER_ID_ERROR })
  .int(INVALID_PLAYER_ID_ERROR)
  .positive(INVALID_PLAYER_ID_ERROR);

const firstZodErrorMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? INVALID_PLAYER_ID_ERROR;

const toPlayerIdResult = (
  playerIdRaw: string | number,
): ParseWatchlistPlayerIdResult => {
  const parsed = playerIdNumberSchema.safeParse(playerIdRaw);

  if (!parsed.success) {
    return { ok: false, error: firstZodErrorMessage(parsed.error) };
  }

  return { ok: true, playerId: parsed.data };
};

interface JsonPlayerIdBody {
  playerId?: string | number | boolean | null;
}

const parseJsonPlayerIdBody = (text: string): JsonPlayerIdBody | null => {
  try {
    const value: JsonPlayerIdBody = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
};

export const parseWatchlistPlayerIdBody = (
  props: ParseWatchlistPlayerIdBodyProps,
): ParseWatchlistPlayerIdResult => {
  const { bodyText } = props;
  const trimmed = bodyText.trim();

  if (trimmed === "") {
    return { ok: false, error: MISSING_PLAYER_ID_ERROR };
  }

  const parsedJson = parseJsonPlayerIdBody(trimmed);

  if (parsedJson === null) {
    return { ok: false, error: INVALID_JSON_BODY_ERROR };
  }

  if (parsedJson.playerId === undefined || parsedJson.playerId === null) {
    return { ok: false, error: MISSING_PLAYER_ID_ERROR };
  }

  if (
    typeof parsedJson.playerId !== "string" &&
    typeof parsedJson.playerId !== "number"
  ) {
    return { ok: false, error: INVALID_PLAYER_ID_ERROR };
  }

  return toPlayerIdResult(parsedJson.playerId);
};

export const parseWatchlistPlayerIdQuery = (
  props: ParseWatchlistPlayerIdQueryProps,
): ParseWatchlistPlayerIdResult => {
  const { searchParams } = props;
  const raw = searchParams.get("playerId");

  if (raw === null || raw.trim() === "") {
    return { ok: false, error: MISSING_PLAYER_ID_ERROR };
  }

  return toPlayerIdResult(raw.trim());
};
