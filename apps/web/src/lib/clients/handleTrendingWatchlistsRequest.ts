import {
  isRequireAdminSessionOk,
  requireAdminSession,
} from "../auth/requireAdminSession";
import { prismaWatchlistStore } from "../watchlist/prismaWatchlistStore";
import type { WatchlistStore } from "../watchlist/types/watchlistStore";
import { parseTrendingLimit } from "./parseTrendingLimit";
import { rankTrendingPlayers } from "./rankTrendingPlayers";
import type {
  HandleTrendingWatchlistsRequestProps,
  TrendingWatchlistsHttpResult,
} from "./types/handleTrendingWatchlistsRequest";

export const handleTrendingWatchlistsRequest = async (
  props: HandleTrendingWatchlistsRequestProps,
  watchlistStore: WatchlistStore = prismaWatchlistStore,
): Promise<TrendingWatchlistsHttpResult> => {
  const { auth, searchParams } = props;
  const admin = requireAdminSession(auth);

  if (!isRequireAdminSessionOk(admin)) {
    return admin;
  }

  const parsedLimit = parseTrendingLimit({ searchParams });
  if (!parsedLimit.ok) {
    return { status: 400, body: { error: parsedLimit.error } };
  }

  const rows = await watchlistStore.countPlayersByClientId(admin.clientId);

  return {
    status: 200,
    body: {
      clientId: admin.clientId,
      players: rankTrendingPlayers({
        rows,
        limit: parsedLimit.limit,
      }),
    },
  };
};
