import type { UnauthorizedHttpResult } from "./unauthorizedResult";

export interface HandleLoginRequestProps {
  bodyText: string;
  now?: Date;
}

export interface LoginSuccessResponse {
  token: string;
}

export interface LoginSuccessHttpResult {
  status: 200;
  body: LoginSuccessResponse;
}

export interface LoginErrorResponse {
  error: string;
}

export interface LoginErrorHttpResult {
  status: 400;
  body: LoginErrorResponse;
}

export interface LoginUnauthorizedHttpResult {
  status: 401;
  body: { error: "invalid_credentials" };
}

export type LoginHttpResult =
  | LoginSuccessHttpResult
  | LoginErrorHttpResult
  | LoginUnauthorizedHttpResult
  | UnauthorizedHttpResult;
