import { UNAUTHORIZED_ERROR } from "./errors";
import type { UnauthorizedHttpResult } from "./types/unauthorizedResult";

export const unauthorizedResult = (): UnauthorizedHttpResult => ({
  status: 401,
  body: { error: UNAUTHORIZED_ERROR },
});
