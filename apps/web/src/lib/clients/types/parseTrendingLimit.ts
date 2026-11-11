export interface ParseTrendingLimitProps {
  searchParams: URLSearchParams;
}

export interface ParseTrendingLimitSuccess {
  ok: true;
  limit: number;
}

export interface ParseTrendingLimitFailure {
  ok: false;
  error: string;
}

export type ParseTrendingLimitResult =
  | ParseTrendingLimitSuccess
  | ParseTrendingLimitFailure;
