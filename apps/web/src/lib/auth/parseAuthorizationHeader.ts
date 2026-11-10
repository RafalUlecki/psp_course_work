import { BEARER_PREFIX } from "./constants";
import type {
  ParseAuthorizationHeaderProps,
  ParseAuthorizationHeaderResult,
} from "./types/parseAuthorizationHeader";

export const parseAuthorizationHeader = (
  props: ParseAuthorizationHeaderProps,
): ParseAuthorizationHeaderResult => {
  const { authorizationHeader } = props;

  if (authorizationHeader === null) {
    return { ok: false };
  }

  const trimmed = authorizationHeader.trim();
  if (trimmed.length <= BEARER_PREFIX.length) {
    return { ok: false };
  }

  const scheme = trimmed.slice(0, BEARER_PREFIX.length);
  if (scheme.toLowerCase() !== BEARER_PREFIX.toLowerCase()) {
    return { ok: false };
  }

  const rawToken = trimmed.slice(BEARER_PREFIX.length).trim();
  if (rawToken === "" || rawToken.includes(" ")) {
    return { ok: false };
  }

  return { ok: true, rawToken };
};
