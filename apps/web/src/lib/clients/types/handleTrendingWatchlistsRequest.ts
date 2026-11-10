import type { ForbiddenHttpResult } from "../../auth/types/forbiddenResult";
import type { RequireAuthSuccess } from "../../auth/types/requireAuth";
import type { UnauthorizedHttpResult } from "../../auth/types/unauthorizedResult";
import type { WatchlistPlayerCount } from "../../watchlist/types/watchlistStore";

export interface HandleTrendingWatchlistsRequestProps {
  auth: RequireAuthSuccess;
  searchParams: URLSearchParams;
}

export interface TrendingWatchlistsResponse {
  clientId: string;
  players: WatchlistPlayerCount[];
}

export interface TrendingWatchlistsSuccessHttpResult {
  status: 200;
  body: TrendingWatchlistsResponse;
}

export interface TrendingWatchlistsErrorHttpResult {
  status: 400;
  body: { error: string };
}

export type TrendingWatchlistsHttpResult =
  | TrendingWatchlistsSuccessHttpResult
  | TrendingWatchlistsErrorHttpResult
  | ForbiddenHttpResult
  | UnauthorizedHttpResult;
