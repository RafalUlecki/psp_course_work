import { prismaAuthTokenStore } from "./prismaAuthTokenStore";
import type { AuthTokenStore } from "./types/authTokenStore";
import type {
  AuthRevokeHttpResult,
  HandleAuthRevokeRequestProps,
} from "./types/handleAuthRevokeRequest";
import { unauthorizedResult } from "./unauthorizedResult";
import { verifyToken } from "./verifyToken";

export const handleAuthRevokeRequest = async (
  props: HandleAuthRevokeRequestProps,
  store: AuthTokenStore = prismaAuthTokenStore,
): Promise<AuthRevokeHttpResult> => {
  const { authorizationHeader, now = new Date() } = props;
  const verified = await verifyToken({ authorizationHeader, now }, store);

  if (!verified.ok) {
    return unauthorizedResult();
  }

  await store.revokeByTokenHash(verified.tokenHash, now);

  return { status: 200, body: { revoked: true } };
};
