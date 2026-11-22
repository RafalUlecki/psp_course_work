import { DEFAULT_CLIENT_LAST_N } from "../clientSettings/constants";
import { prismaClientSettingsStore } from "../clientSettings/prismaClientSettingsStore";
import type { ClientSettingsStore } from "../clientSettings/types/clientSettingsStore";
import { getGameLogsByPlayerId } from "../gameLogs/getGameLogsByPlayerId";
import { getHitRate } from "./getHitRate";
import { HitRateQueryParam } from "./query/hitRateQueryParam";
import type { HitRateHttpResult } from "./types/api";
import type { GameLogLoader } from "./types/getHitRate";
import type { HandleHitRateRequestProps } from "./types/handleHitRateRequest";

interface ResolveHitRateSearchParamsProps {
  searchParams: URLSearchParams;
  clientId: string;
}

const hasOwnLastN = (searchParams: URLSearchParams): boolean => {
  const lastNParam = searchParams.get(HitRateQueryParam.lastN);
  return lastNParam !== null && lastNParam.trim() !== "";
};

const searchParamsWithClientLastN = async (
  props: ResolveHitRateSearchParamsProps,
  store: ClientSettingsStore,
): Promise<URLSearchParams> => {
  const { searchParams, clientId } = props;

  if (hasOwnLastN(searchParams)) {
    return searchParams;
  }

  const settings = await store.getByClientId(clientId);
  const resolved = new URLSearchParams(searchParams);
  resolved.set(
    HitRateQueryParam.lastN,
    String(settings?.defaultLastN ?? DEFAULT_CLIENT_LAST_N),
  );
  return resolved;
};

export const handleHitRateRequest = async (
  props: HandleHitRateRequestProps,
  loadGameLogs: GameLogLoader = getGameLogsByPlayerId,
  settingsStore: ClientSettingsStore = prismaClientSettingsStore,
): Promise<HitRateHttpResult> => {
  const { searchParams, auth } = props;

  if (auth.skipped) {
    return getHitRate({ searchParams }, loadGameLogs);
  }

  return getHitRate(
    {
      searchParams: await searchParamsWithClientLastN(
        { searchParams, clientId: auth.clientId },
        settingsStore,
      ),
    },
    loadGameLogs,
  );
};
