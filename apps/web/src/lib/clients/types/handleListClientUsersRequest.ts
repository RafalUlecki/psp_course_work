import type { ForbiddenHttpResult } from "../../auth/types/forbiddenResult";
import type { RequireAuthSuccess } from "../../auth/types/requireAuth";
import type { UnauthorizedHttpResult } from "../../auth/types/unauthorizedResult";
import type { UserPublicRecord } from "../../auth/types/userStore";

export interface HandleListClientUsersRequestProps {
  auth: RequireAuthSuccess;
}

export interface ListClientUsersResponse {
  clientId: string;
  users: UserPublicRecord[];
}

export interface ListClientUsersSuccessHttpResult {
  status: 200;
  body: ListClientUsersResponse;
}

export type ListClientUsersHttpResult =
  | ListClientUsersSuccessHttpResult
  | ForbiddenHttpResult
  | UnauthorizedHttpResult;
