import { getGameLogsByPlayerId } from "../gameLogs/getGameLogsByPlayerId";
import { getHitRate } from "./getHitRate";
import type { HitRateHttpResult } from "./types/api";
import type { GameLogLoader } from "./types/getHitRate";
import type { HandleHitRateRequestProps } from "./types/handleHitRateRequest";

export const handleHitRateRequest = async (
  props: HandleHitRateRequestProps,
  loadGameLogs: GameLogLoader = getGameLogsByPlayerId,
): Promise<HitRateHttpResult> => {
  const { searchParams } = props;
  return getHitRate({ searchParams }, loadGameLogs);
};
