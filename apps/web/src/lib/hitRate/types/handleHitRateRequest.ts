export interface HandleHitRateRequestProps {
  authorizationHeader: string | null;
  searchParams: URLSearchParams;
  now?: Date;
  authRequired?: boolean;
}
