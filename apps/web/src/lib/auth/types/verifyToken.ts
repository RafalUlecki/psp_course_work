export interface VerifyTokenProps {
  authorizationHeader: string | null;
  now: Date;
}

export interface VerifyTokenSuccess {
  ok: true;
  clientId: string;
  tokenHash: string;
}

export interface VerifyTokenFailure {
  ok: false;
}

export type VerifyTokenResult = VerifyTokenSuccess | VerifyTokenFailure;
