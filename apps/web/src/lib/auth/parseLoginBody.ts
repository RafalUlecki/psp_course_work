import { z } from "zod";

import {
  INVALID_EMAIL_ERROR,
  INVALID_JSON_BODY_ERROR,
  INVALID_LOGIN_BODY_ERROR,
  MISSING_EMAIL_ERROR,
  MISSING_PASSWORD_ERROR,
} from "./errors";
import type {
  ParseLoginBodyProps,
  ParseLoginBodyResult,
} from "./types/parseLoginBody";

const loginBodySchema = z.object({
  email: z
    .string({ error: MISSING_EMAIL_ERROR })
    .trim()
    .min(1, MISSING_EMAIL_ERROR)
    .email(INVALID_EMAIL_ERROR)
    .transform((email) => email.toLowerCase()),
  password: z
    .string({ error: MISSING_PASSWORD_ERROR })
    .min(1, MISSING_PASSWORD_ERROR),
});

interface JsonLoginBody {
  email?: string | number | boolean | null;
  password?: string | number | boolean | null;
}

const firstZodErrorMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? INVALID_LOGIN_BODY_ERROR;

const parseJsonLoginBody = (text: string): JsonLoginBody | null => {
  try {
    const value: JsonLoginBody = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
};

export const parseLoginBody = (
  props: ParseLoginBodyProps,
): ParseLoginBodyResult => {
  const { bodyText } = props;
  const trimmed = bodyText.trim();

  if (trimmed === "") {
    return { ok: false, error: INVALID_LOGIN_BODY_ERROR };
  }

  const parsedJson = parseJsonLoginBody(trimmed);

  if (parsedJson === null) {
    return { ok: false, error: INVALID_JSON_BODY_ERROR };
  }

  const parsed = loginBodySchema.safeParse(parsedJson);

  if (!parsed.success) {
    return { ok: false, error: firstZodErrorMessage(parsed.error) };
  }

  return {
    ok: true,
    email: parsed.data.email,
    password: parsed.data.password,
  };
};
