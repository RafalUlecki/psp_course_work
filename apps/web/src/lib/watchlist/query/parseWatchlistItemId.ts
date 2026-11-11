import { z } from "zod";

import {
  INVALID_WATCHLIST_ITEM_ID_ERROR,
  MISSING_WATCHLIST_ITEM_ID_ERROR,
} from "../errors";
import type {
  ParseWatchlistItemIdQueryProps,
  ParseWatchlistItemIdResult,
} from "../types/parseWatchlistItemId";

const itemIdNumberSchema = z.coerce
  .number({ error: INVALID_WATCHLIST_ITEM_ID_ERROR })
  .int(INVALID_WATCHLIST_ITEM_ID_ERROR)
  .positive(INVALID_WATCHLIST_ITEM_ID_ERROR);

const firstZodErrorMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? INVALID_WATCHLIST_ITEM_ID_ERROR;

export const parseWatchlistItemIdQuery = (
  props: ParseWatchlistItemIdQueryProps,
): ParseWatchlistItemIdResult => {
  const { searchParams } = props;
  const raw = searchParams.get("id");

  if (raw === null || raw.trim() === "") {
    return { ok: false, error: MISSING_WATCHLIST_ITEM_ID_ERROR };
  }

  const parsed = itemIdNumberSchema.safeParse(raw.trim());

  if (!parsed.success) {
    return { ok: false, error: firstZodErrorMessage(parsed.error) };
  }

  return { ok: true, id: parsed.data };
};
