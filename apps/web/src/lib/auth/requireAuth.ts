import { isAuthRequired } from "./parseAuthRequired";
import { prismaAuthTokenStore } from "./prismaAuthTokenStore";
import { isPublicApiRoute } from "./publicApiRoutes";
import type { AuthTokenStore } from "./types/authTokenStore";
import type {
  RequireAuthProps,
  RequireAuthResult,
  RequireAuthSuccess,
} from "./types/requireAuth";
import { unauthorizedResult } from "./unauthorizedResult";
import { verifyToken } from "./verifyToken";

const OPTIONS_METHOD = "OPTIONS";

const skippedResult = (): RequireAuthSuccess => ({
  ok: true,
  skipped: true,
});

export const isRequireAuthOk = (
  result: RequireAuthResult,
): result is RequireAuthSuccess => "ok" in result && result.ok === true;

export const requireAuth = async (
  props: RequireAuthProps,
  store: AuthTokenStore = prismaAuthTokenStore,
): Promise<RequireAuthResult> => {
  const {
    authorizationHeader,
    now,
    method,
    pathname,
    authRequired = isAuthRequired(),
    publicRoutes,
  } = props;

  if (method === OPTIONS_METHOD) {
    return skippedResult();
  }

  if (
    pathname !== undefined &&
    isPublicApiRoute({ pathname, publicRoutes })
  ) {
    return skippedResult();
  }

  if (!authRequired) {
    return skippedResult();
  }

  const verified = await verifyToken({ authorizationHeader, now }, store);
  if (!verified.ok) {
    return unauthorizedResult();
  }

  return {
    ok: true,
    skipped: false,
    clientId: verified.clientId,
    tokenHash: verified.tokenHash,
  };
};
