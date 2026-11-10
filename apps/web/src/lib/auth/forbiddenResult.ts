import { FORBIDDEN_ERROR } from "./errors";
import type { ForbiddenHttpResult } from "./types/forbiddenResult";

export const forbiddenResult = (): ForbiddenHttpResult => ({
  status: 403,
  body: { error: FORBIDDEN_ERROR },
});
