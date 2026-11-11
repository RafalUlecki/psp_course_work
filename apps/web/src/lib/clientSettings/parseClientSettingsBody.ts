import { z } from "zod";

import {
  INVALID_DEFAULT_LAST_N_ERROR,
  INVALID_JSON_BODY_ERROR,
  MISSING_DEFAULT_LAST_N_ERROR,
} from "./errors";
import type {
  ParseClientSettingsBodyProps,
  ParseClientSettingsBodyResult,
} from "./types/parseClientSettingsBody";

const defaultLastNSchema = z.union([z.literal(5), z.literal(10)], {
  error: INVALID_DEFAULT_LAST_N_ERROR,
});

interface JsonClientSettingsBody {
  defaultLastN?: string | number | boolean | null;
  clientId?: string | number | boolean | null;
}

const firstZodErrorMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? INVALID_DEFAULT_LAST_N_ERROR;

const parseJsonClientSettingsBody = (
  text: string,
): JsonClientSettingsBody | null => {
  try {
    const value: JsonClientSettingsBody = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
};

export const parseClientSettingsBody = (
  props: ParseClientSettingsBodyProps,
): ParseClientSettingsBodyResult => {
  const { bodyText } = props;
  const trimmed = bodyText.trim();

  if (trimmed === "") {
    return { ok: false, error: MISSING_DEFAULT_LAST_N_ERROR };
  }

  const parsedJson = parseJsonClientSettingsBody(trimmed);

  if (parsedJson === null) {
    return { ok: false, error: INVALID_JSON_BODY_ERROR };
  }

  if (
    parsedJson.defaultLastN === undefined ||
    parsedJson.defaultLastN === null
  ) {
    return { ok: false, error: MISSING_DEFAULT_LAST_N_ERROR };
  }

  const parsed = defaultLastNSchema.safeParse(parsedJson.defaultLastN);

  if (!parsed.success) {
    return { ok: false, error: firstZodErrorMessage(parsed.error) };
  }

  return { ok: true, defaultLastN: parsed.data };
};
