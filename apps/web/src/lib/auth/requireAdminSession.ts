import { forbiddenResult } from "./forbiddenResult";
import { isAdminAuth } from "./isAdminAuth";
import type { RequireAuthSuccess } from "./types/requireAuth";
import type { RequireAdminSessionResult } from "./types/requireAdminSession";
import { unauthorizedResult } from "./unauthorizedResult";

export const isRequireAdminSessionOk = (
  result: RequireAdminSessionResult,
): result is Extract<RequireAdminSessionResult, { ok: true }> =>
  "ok" in result && result.ok === true;

export const requireAdminSession = (
  auth: RequireAuthSuccess,
): RequireAdminSessionResult => {
  if (auth.skipped) {
    return unauthorizedResult();
  }

  if (!isAdminAuth(auth)) {
    return forbiddenResult();
  }

  return {
    ok: true,
    userId: auth.userId,
    clientId: auth.clientId,
  };
};
