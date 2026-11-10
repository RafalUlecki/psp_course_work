export interface ParseWatchlistItemIdQueryProps {
  searchParams: URLSearchParams;
}

export interface ParseWatchlistItemIdSuccess {
  ok: true;
  id: number;
}

export interface ParseWatchlistItemIdFailure {
  ok: false;
  error: string;
}

export type ParseWatchlistItemIdResult =
  | ParseWatchlistItemIdSuccess
  | ParseWatchlistItemIdFailure;
