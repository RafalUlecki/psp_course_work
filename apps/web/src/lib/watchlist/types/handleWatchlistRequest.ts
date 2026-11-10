import type { RequireAuthSuccess } from "../../auth/types/requireAuth";

export interface HandleWatchlistRequestProps {
  method: string;
  headers: Headers;
  searchParams: URLSearchParams;
  bodyText: string;
  auth: RequireAuthSuccess;
}
