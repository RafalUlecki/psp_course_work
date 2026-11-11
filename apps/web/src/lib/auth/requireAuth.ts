import { isAuthRequired } from "./parseAuthRequired";
import { prismaAuthTokenStore } from "./prismaAuthTokenStore";
import { prismaUserStore } from "./prismaUserStore";
import { isPublicApiRoute } from "./publicApiRoutes";
import { resolveAuthSession } from "./resolveAuthSession";
import type { AuthTokenStore } from "./types/authTokenStore";
import type {
  RequireAuthProps,
  RequireAuthResult,
  RequireAuthSuccess,
} from "./types/requireAuth";
import type { UserStore } from "./types/userStore";
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
  userStore: UserStore = prismaUserStore,
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

  const session = await resolveAuthSession(
    { userId: verified.userId },
    userStore,
  );
  if (session === null) {
    return unauthorizedResult();
  }

  return {
    ok: true,
    skipped: false,
    userId: session.userId,
    clientId: session.clientId,
    role: session.role,
    tokenHash: verified.tokenHash,
  };
};
