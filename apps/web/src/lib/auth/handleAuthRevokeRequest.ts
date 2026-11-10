import { prismaAuthTokenStore } from "./prismaAuthTokenStore";
import type { AuthTokenStore } from "./types/authTokenStore";
import type {
  AuthRevokeHttpResult,
  HandleAuthRevokeRequestProps,
} from "./types/handleAuthRevokeRequest";
import { unauthorizedResult } from "./unauthorizedResult";

export const handleAuthRevokeRequest = async (
  props: HandleAuthRevokeRequestProps,
  store: AuthTokenStore = prismaAuthTokenStore,
): Promise<AuthRevokeHttpResult> => {
  const { auth, now = new Date() } = props;

  if (auth.skipped) {
    return unauthorizedResult();
  }

  await store.revokeByTokenHash(auth.tokenHash, now);

  return { status: 200, body: { revoked: true } };
};
