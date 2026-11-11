import type { ForbiddenHttpResult } from "./forbiddenResult";
import type { UnauthorizedHttpResult } from "./unauthorizedResult";

export interface RequireAdminSessionSuccess {
  ok: true;
  userId: string;
  clientId: string;
}

export type RequireAdminSessionResult =
  | RequireAdminSessionSuccess
  | ForbiddenHttpResult
  | UnauthorizedHttpResult;
