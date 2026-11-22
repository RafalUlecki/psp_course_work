import type { RequireAuthSuccess } from "../../auth/types/requireAuth";

export interface HandleHitRateRequestProps {
  searchParams: URLSearchParams;
  auth: RequireAuthSuccess;
}
