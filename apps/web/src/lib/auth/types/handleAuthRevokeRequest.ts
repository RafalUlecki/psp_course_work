import type { UnauthorizedHttpResult } from "./unauthorizedResult";

export interface HandleAuthRevokeRequestProps {
  authorizationHeader: string | null;
  now?: Date;
}

export interface AuthRevokeSuccessResponse {
  revoked: true;
}

export interface AuthRevokeSuccessHttpResult {
  status: 200;
  body: AuthRevokeSuccessResponse;
}

export type AuthRevokeHttpResult =
  | AuthRevokeSuccessHttpResult
  | UnauthorizedHttpResult;
