export interface ParseClientIdHeaderProps {
  headers: Headers;
}

export interface ParseClientIdHeaderSuccess {
  ok: true;
  clientId: string;
}

export interface ParseClientIdHeaderFailure {
  ok: false;
  error: string;
}

export type ParseClientIdHeaderResult =
  | ParseClientIdHeaderSuccess
  | ParseClientIdHeaderFailure;
