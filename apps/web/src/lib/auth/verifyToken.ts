import { parseAuthorizationHeader } from "./parseAuthorizationHeader";
import { hashToken } from "./tokenSecret";
import type { AuthTokenStore } from "./types/authTokenStore";
import type {
  VerifyTokenProps,
  VerifyTokenResult,
} from "./types/verifyToken";

export const verifyToken = async (
  props: VerifyTokenProps,
  store: AuthTokenStore,
): Promise<VerifyTokenResult> => {
  const { authorizationHeader, now } = props;
  const parsed = parseAuthorizationHeader({ authorizationHeader });

  if (!parsed.ok) {
    return { ok: false };
  }

  const tokenHash = hashToken(parsed.rawToken);
  const record = await store.findByTokenHash(tokenHash);

  if (record === null) {
    return { ok: false };
  }

  if (record.revokedAt !== null) {
    return { ok: false };
  }

  if (now.getTime() >= record.expiresAt.getTime()) {
    return { ok: false };
  }

  return { ok: true, clientId: record.clientId, tokenHash: record.tokenHash };
};
