import type { RequireAuthSuccess } from "./types/requireAuth";

export const isAdminAuth = (auth: RequireAuthSuccess): boolean =>
  !auth.skipped && auth.role === "admin";
