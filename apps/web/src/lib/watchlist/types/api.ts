export interface WatchlistItemDto {
  playerId: number;
}

export interface WatchlistListResponse {
  clientId: string;
  items: WatchlistItemDto[];
}

export interface WatchlistMutationResponse {
  clientId: string;
  playerId: number;
}

export interface WatchlistErrorResponse {
  error: string;
}

export interface WatchlistListHttpResult {
  status: 200;
  body: WatchlistListResponse;
}

export interface WatchlistMutationHttpResult {
  status: 200 | 201;
  body: WatchlistMutationResponse;
}

export interface WatchlistErrorHttpResult {
  status: 400 | 401 | 405;
  body: WatchlistErrorResponse;
}

export type WatchlistHttpResult =
  | WatchlistListHttpResult
  | WatchlistMutationHttpResult
  | WatchlistErrorHttpResult;
