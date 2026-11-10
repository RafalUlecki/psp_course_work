export interface ParseAuthTokenTtlDaysProps {
  raw: string | undefined;
}

export interface ParseAuthTokenTtlDaysSuccess {
  ok: true;
  days: number;
}

export interface ParseAuthTokenTtlDaysFailure {
  ok: false;
  error: string;
}

export type ParseAuthTokenTtlDaysResult =
  | ParseAuthTokenTtlDaysSuccess
  | ParseAuthTokenTtlDaysFailure;
