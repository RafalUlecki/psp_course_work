import {
  FETCH_HIT_RATE_MESSAGE,
  HIT_RATE_API_PATH,
} from "./lib/genericProp/constants/genericPropConstants";
import type {
  FetchHitRateMessage,
  FetchHitRateResponse,
} from "./lib/genericProp/types/hitRateMessage";

const HIT_RATE_API_BASE =
  import.meta.env.VITE_HIT_RATE_API_BASE || "http://localhost:3000";

const isFetchHitRateMessage = (
  message: FetchHitRateMessage | { type?: string },
): message is FetchHitRateMessage => message.type === FETCH_HIT_RATE_MESSAGE;

const fetchHitRateFromApi = async (
  message: FetchHitRateMessage,
): Promise<FetchHitRateResponse> => {
  const { playerId, stat, line, lastN, opponent, venue } = message;
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
    `${HIT_RATE_API_BASE}${HIT_RATE_API_PATH}?${params.toString()}`,
  );

  if (!response.ok) {
    return { ok: false };
  }

  return { ok: true, body: await response.json() };
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isFetchHitRateMessage(message)) {
    return false;
  }

  void fetchHitRateFromApi(message)
    .then((result) => {
      sendResponse(result);
    })
    .catch(() => {
      const failure: FetchHitRateResponse = { ok: false };
      sendResponse(failure);
    });

  return true;
});
