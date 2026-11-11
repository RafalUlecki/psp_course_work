import type { UserRole } from "./userRole";
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
  userId: string;
  clientId: string;
  role: UserRole;
  tokenHash: string;
}

export interface RequireAuthSkipped {
  ok: true;
  skipped: true;
}

export type RequireAuthSuccess = RequireAuthAuthenticated | RequireAuthSkipped;

export type RequireAuthResult = RequireAuthSuccess | UnauthorizedHttpResult;
