import {
  CLIENT_ID_HEADER,
  FETCH_HIT_RATE_MESSAGE,
  HIT_RATE_API_PATH,
  WATCHLIST_API_PATH,
  WATCHLIST_REQUEST_MESSAGE,
} from "./lib/genericProp/constants/genericPropConstants";
import type {
  FetchHitRateMessage,
  FetchHitRateResponse,
} from "./lib/genericProp/types/hitRateMessage";
import type {
  WatchlistRequestMessage,
  WatchlistRequestResponse,
} from "./lib/genericProp/types/watchlistMessage";

const HIT_RATE_API_BASE =
  import.meta.env.VITE_HIT_RATE_API_BASE || "http://localhost:3000";

const isFetchHitRateMessage = (
  message: FetchHitRateMessage | WatchlistRequestMessage | { type?: string },
): message is FetchHitRateMessage => message.type === FETCH_HIT_RATE_MESSAGE;

const isWatchlistRequestMessage = (
  message: FetchHitRateMessage | WatchlistRequestMessage | { type?: string },
): message is WatchlistRequestMessage =>
  message.type === WATCHLIST_REQUEST_MESSAGE;

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

const fetchWatchlistFromApi = async (
  message: WatchlistRequestMessage,
): Promise<WatchlistRequestResponse> => {
  const { method, clientId } = message;
  const headers: Record<string, string> = {
    [CLIENT_ID_HEADER]: clientId,
  };
  const init: RequestInit = { method, headers };
  let url = `${HIT_RATE_API_BASE}${WATCHLIST_API_PATH}`;

  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify({ playerId: message.playerId });
  }

  if (method === "DELETE") {
    url += `?playerId=${message.playerId}`;
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    return { ok: false };
  }

  return { ok: true, body: await response.json() };
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (isFetchHitRateMessage(message)) {
    void fetchHitRateFromApi(message)
      .then((result) => {
        sendResponse(result);
      })
      .catch(() => {
        const failure: FetchHitRateResponse = { ok: false };
        sendResponse(failure);
      });
    return true;
  }

  if (isWatchlistRequestMessage(message)) {
    void fetchWatchlistFromApi(message)
      .then((result) => {
        sendResponse(result);
      })
      .catch(() => {
        const failure: WatchlistRequestResponse = { ok: false };
        sendResponse(failure);
      });
    return true;
  }

  return false;
});
