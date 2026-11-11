export interface WatchlistItemDto {
  id: number;
  playerId: number;
}

export interface WatchlistListResponse {
  userId: string;
  clientId: string;
  items: WatchlistItemDto[];
}

export interface WatchlistItemResponse {
  userId: string;
  clientId: string;
  id: number;
  playerId: number;
}

export interface WatchlistMutationResponse {
  userId: string;
  clientId: string;
  playerId: number;
  id?: number;
}

export interface WatchlistErrorResponse {
  error: string;
}

export interface WatchlistListHttpResult {
  status: 200;
  body: WatchlistListResponse;
}

export interface WatchlistItemHttpResult {
  status: 200;
  body: WatchlistItemResponse;
}

export interface WatchlistMutationHttpResult {
  status: 200 | 201;
  body: WatchlistMutationResponse;
}

export interface WatchlistErrorHttpResult {
  status: 400 | 401 | 403 | 404 | 405;
  body: WatchlistErrorResponse;
}

export type WatchlistHttpResult =
  | WatchlistListHttpResult
  | WatchlistItemHttpResult
  | WatchlistMutationHttpResult
  | WatchlistErrorHttpResult;
