export interface ParseWatchlistPlayerIdSuccess {
  ok: true;
  playerId: number;
}

export interface ParseWatchlistPlayerIdFailure {
  ok: false;
  error: string;
}

export type ParseWatchlistPlayerIdResult =
  | ParseWatchlistPlayerIdSuccess
  | ParseWatchlistPlayerIdFailure;

export interface ParseWatchlistPlayerIdBodyProps {
  bodyText: string;
}

export interface ParseWatchlistPlayerIdQueryProps {
  searchParams: URLSearchParams;
}
