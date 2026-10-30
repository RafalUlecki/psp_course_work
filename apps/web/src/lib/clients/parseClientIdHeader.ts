import { CLIENT_ID_HEADER } from "./constants";
import { MISSING_CLIENT_ID_ERROR } from "./errors";
import type {
  ParseClientIdHeaderProps,
  ParseClientIdHeaderResult,
} from "./types/parseClientIdHeader";

export const parseClientIdHeader = (
  props: ParseClientIdHeaderProps,
): ParseClientIdHeaderResult => {
  const { headers } = props;
  const raw = headers.get(CLIENT_ID_HEADER);

  if (raw === null) {
    return { ok: false, error: MISSING_CLIENT_ID_ERROR };
  }

  const clientId = raw.trim();

  if (clientId === "") {
    return { ok: false, error: MISSING_CLIENT_ID_ERROR };
  }

  return { ok: true, clientId };
};
