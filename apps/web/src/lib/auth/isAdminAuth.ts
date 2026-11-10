import type { RequireAuthSuccess } from "./types/requireAuth";

export const isAdminAuth = (auth: RequireAuthSuccess): boolean => {
  if (auth.skipped) {
    return true;
  }

  return auth.role === "admin";
};
