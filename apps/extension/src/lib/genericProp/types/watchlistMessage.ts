import type { WATCHLIST_REQUEST_MESSAGE } from "../constants/genericPropConstants";

export interface WatchlistItemDto {
  playerId: number;
}

export interface WatchlistListBody {
  clientId: string;
  items: WatchlistItemDto[];
}

export interface WatchlistGetMessage {
  type: typeof WATCHLIST_REQUEST_MESSAGE;
  method: "GET";
  clientId: string;
}

export interface WatchlistMutateMessage {
  type: typeof WATCHLIST_REQUEST_MESSAGE;
  method: "POST" | "DELETE";
  clientId: string;
  playerId: number;
}

export type WatchlistRequestMessage =
  | WatchlistGetMessage
  | WatchlistMutateMessage;

export interface WatchlistMutationBody {
  clientId: string;
  playerId: number;
}

export interface WatchlistRequestSuccess {
  ok: true;
  body: WatchlistListBody | WatchlistMutationBody;
}

export interface WatchlistRequestFailure {
  ok: false;
}

export type WatchlistRequestResponse =
  | WatchlistRequestSuccess
  | WatchlistRequestFailure;
