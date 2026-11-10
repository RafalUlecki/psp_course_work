import type { UnauthorizedHttpResult } from "./unauthorizedResult";

export interface RequireAuthProps {
  authorizationHeader: string | null;
  now: Date;
  method?: string;
  pathname?: string;
  authRequired?: boolean;
  publicRoutes?: readonly string[];
}

export interface RequireAuthAuthenticated {
  ok: true;
  skipped: false;
  clientId: string;
  tokenHash: string;
}

export interface RequireAuthSkipped {
  ok: true;
  skipped: true;
}

export type RequireAuthSuccess = RequireAuthAuthenticated | RequireAuthSkipped;

export type RequireAuthResult = RequireAuthSuccess | UnauthorizedHttpResult;
