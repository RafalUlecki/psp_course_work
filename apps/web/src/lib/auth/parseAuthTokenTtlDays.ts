import {
  AUTH_TOKEN_TTL_DAYS_ENV,
  DEFAULT_AUTH_TOKEN_TTL_DAYS,
} from "./constants";
import { INVALID_AUTH_TOKEN_TTL_DAYS_ERROR } from "./errors";
import type {
  ParseAuthTokenTtlDaysProps,
  ParseAuthTokenTtlDaysResult,
} from "./types/parseAuthTokenTtlDays";

export const parseAuthTokenTtlDays = (
  props: ParseAuthTokenTtlDaysProps,
): ParseAuthTokenTtlDaysResult => {
  const { raw } = props;

  if (raw === undefined) {
    return { ok: true, days: DEFAULT_AUTH_TOKEN_TTL_DAYS };
  }

  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: true, days: DEFAULT_AUTH_TOKEN_TTL_DAYS };
  }

  const days = Number(trimmed);
  if (!Number.isFinite(days) || days < 1) {
    return { ok: false, error: INVALID_AUTH_TOKEN_TTL_DAYS_ERROR };
  }

  return { ok: true, days };
};

export const getAuthTokenTtlDays = (): number => {
  const parsed = parseAuthTokenTtlDays({
    raw: process.env[AUTH_TOKEN_TTL_DAYS_ENV],
  });

  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  return parsed.days;
};

export const assertAuthEnv = (): void => {
  getAuthTokenTtlDays();
};
