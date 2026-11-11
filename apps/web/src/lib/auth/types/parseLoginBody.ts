export interface ParseLoginBodyProps {
  bodyText: string;
}

export interface ParseLoginBodySuccess {
  ok: true;
  email: string;
  password: string;
}

export interface ParseLoginBodyFailure {
  ok: false;
  error: string;
}

export type ParseLoginBodyResult = ParseLoginBodySuccess | ParseLoginBodyFailure;
