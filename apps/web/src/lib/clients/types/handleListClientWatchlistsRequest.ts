import type { ForbiddenHttpResult } from "../../auth/types/forbiddenResult";
import type { RequireAuthSuccess } from "../../auth/types/requireAuth";
import type { UnauthorizedHttpResult } from "../../auth/types/unauthorizedResult";
import type { UserRole } from "../../auth/types/userRole";

export interface HandleListClientWatchlistsRequestProps {
  auth: RequireAuthSuccess;
}

export interface ClientWatchlistItemDto {
  id: number;
  playerId: number;
}

export interface ClientUserWatchlistDto {
  userId: string;
  email: string;
  role: UserRole;
  items: ClientWatchlistItemDto[];
}

export interface ListClientWatchlistsResponse {
  clientId: string;
  watchlists: ClientUserWatchlistDto[];
}

export interface ListClientWatchlistsSuccessHttpResult {
  status: 200;
  body: ListClientWatchlistsResponse;
}

export type ListClientWatchlistsHttpResult =
  | ListClientWatchlistsSuccessHttpResult
  | ForbiddenHttpResult
  | UnauthorizedHttpResult;
