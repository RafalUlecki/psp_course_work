import { prismaAuthTokenStore } from "../auth/prismaAuthTokenStore";
import type { AuthTokenStore } from "../auth/types/authTokenStore";
import { unauthorizedResult } from "../auth/unauthorizedResult";
import { verifyToken } from "../auth/verifyToken";
import { getGameLogsByPlayerId } from "../gameLogs/getGameLogsByPlayerId";
import { getHitRate } from "./getHitRate";
import type { HitRateHttpResult } from "./types/api";
import type { GameLogLoader } from "./types/getHitRate";
import type { HandleHitRateRequestProps } from "./types/handleHitRateRequest";

export const handleHitRateRequest = async (
  props: HandleHitRateRequestProps,
  authStore: AuthTokenStore = prismaAuthTokenStore,
  loadGameLogs: GameLogLoader = getGameLogsByPlayerId,
): Promise<HitRateHttpResult> => {
  const {
    authorizationHeader,
    searchParams,
    now = new Date(),
    authRequired = true,
  } = props;

  if (authRequired) {
    const verified = await verifyToken({ authorizationHeader, now }, authStore);
    if (!verified.ok) {
      return unauthorizedResult();
    }
  }

  return getHitRate({ searchParams }, loadGameLogs);
};
