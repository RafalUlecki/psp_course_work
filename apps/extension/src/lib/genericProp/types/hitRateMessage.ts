import type { HitRateSuccessResponse } from "../../../components/hitRateCard/types/hitRateApi";
import type { FETCH_HIT_RATE_MESSAGE } from "../constants/genericPropConstants";

export interface FetchHitRateMessage {
  type: typeof FETCH_HIT_RATE_MESSAGE;
  playerId: string;
  stat: string;
  line: number;
  lastN: number;
  opponent: string;
  venue: string;
}

export interface FetchHitRateSuccessResponse {
  ok: true;
  body: HitRateSuccessResponse;
}

export interface FetchHitRateFailureResponse {
  ok: false;
}

export type FetchHitRateResponse =
  | FetchHitRateSuccessResponse
  | FetchHitRateFailureResponse;
