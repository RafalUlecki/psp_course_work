import type { HitRateSuccessResponse } from "../types/hitRateApi";

export interface FetchHitRateProps {
  playerId: string;
  stat: string;
  line: number;
  lastN: number;
  opponent: string;
  venue: string;
}

export const fetchHitRate = async (
  props: FetchHitRateProps,
): Promise<HitRateSuccessResponse> => {
  const { playerId, stat, line, lastN, opponent, venue } = props;
  // Single API-origin constant. Set VITE_HIT_RATE_API_BASE in apps/extension/.env
  // (see .env.example). Local dev should match NEXT_PUBLIC_API_BASE_URL in
  // apps/web/.env.example. Empty string = same-origin relative /api/hit-rate.
  const HIT_RATE_API_BASE = import.meta.env.VITE_HIT_RATE_API_BASE ?? "";

  const params = new URLSearchParams({
    playerId,
    stat,
    line: String(line),
    lastN: String(lastN),
  });

  if (opponent.length > 0) {
    params.set("opponent", opponent);
  }

  if (venue.length > 0) {
    params.set("venue", venue);
  }

  const response = await fetch(
    `${HIT_RATE_API_BASE}/api/hit-rate?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Hit rate request failed");
  }

  const body: HitRateSuccessResponse = await response.json();
  return body;
};
