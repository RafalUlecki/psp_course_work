export interface ParseAuthorizationHeaderProps {
  authorizationHeader: string | null;
}

export interface ParseAuthorizationHeaderSuccess {
  ok: true;
  rawToken: string;
}

export interface ParseAuthorizationHeaderFailure {
  ok: false;
}

export type ParseAuthorizationHeaderResult =
  | ParseAuthorizationHeaderSuccess
  | ParseAuthorizationHeaderFailure;
