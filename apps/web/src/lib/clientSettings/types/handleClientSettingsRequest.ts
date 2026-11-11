import type { RequireAuthSuccess } from "../../auth/types/requireAuth";

export interface HandleClientSettingsRequestProps {
  method: string;
  searchParams: URLSearchParams;
  bodyText: string;
  auth: RequireAuthSuccess;
}
