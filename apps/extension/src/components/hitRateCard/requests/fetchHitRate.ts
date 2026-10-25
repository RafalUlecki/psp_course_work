import { FETCH_HIT_RATE_MESSAGE } from "../../../lib/genericProp/constants/genericPropConstants";
import type {
  FetchHitRateMessage,
  FetchHitRateResponse,
  FetchHitRateSuccessResponse,
} from "../../../lib/genericProp/types/hitRateMessage";
import type { HitRateSuccessResponse } from "../types/hitRateApi";

export interface FetchHitRateProps {
  playerId: string;
  stat: string;
  line: number;
  lastN: number;
  opponent: string;
  venue: string;
}

const isOkResponse = (
  response: FetchHitRateResponse,
): response is FetchHitRateSuccessResponse => response.ok;

export const fetchHitRate = async (
  props: FetchHitRateProps,
): Promise<HitRateSuccessResponse> => {
  const { playerId, stat, line, lastN, opponent, venue } = props;
  const message: FetchHitRateMessage = {
    type: FETCH_HIT_RATE_MESSAGE,
    playerId,
    stat,
    line,
    lastN,
    opponent,
    venue,
  };
  const response = (await chrome.runtime.sendMessage(
    message,
  )) as FetchHitRateResponse;

  if (!isOkResponse(response)) {
    throw new Error("Hit rate request failed");
  }

  return response.body;
};
