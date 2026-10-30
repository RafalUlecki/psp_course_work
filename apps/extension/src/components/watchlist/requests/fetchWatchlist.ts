import { WATCHLIST_REQUEST_MESSAGE } from "../../../lib/genericProp/constants/genericPropConstants";
import type {
  WatchlistListBody,
  WatchlistRequestMessage,
  WatchlistRequestResponse,
  WatchlistRequestSuccess,
} from "../../../lib/genericProp/types/watchlistMessage";

const isListSuccess = (
  response: WatchlistRequestResponse,
): response is WatchlistRequestSuccess & { body: WatchlistListBody } => {
  if (!response.ok) {
    return false;
  }

  return "items" in response.body;
};

const sendWatchlistMessage = async (
  message: WatchlistRequestMessage,
): Promise<WatchlistRequestResponse> => {
  const response = (await chrome.runtime.sendMessage(
    message,
  )) as WatchlistRequestResponse;
  return response;
};

export const fetchWatchlist = async (props: {
  clientId: string;
}): Promise<WatchlistListBody> => {
  const { clientId } = props;
  const response = await sendWatchlistMessage({
    type: WATCHLIST_REQUEST_MESSAGE,
    method: "GET",
    clientId,
  });

  if (!isListSuccess(response)) {
    throw new Error("Watchlist request failed");
  }

  return response.body;
};

export const addWatchlistPlayer = async (props: {
  clientId: string;
  playerId: number;
}): Promise<void> => {
  const { clientId, playerId } = props;
  const response = await sendWatchlistMessage({
    type: WATCHLIST_REQUEST_MESSAGE,
    method: "POST",
    clientId,
    playerId,
  });

  if (!response.ok) {
    throw new Error("Watchlist add failed");
  }
};

export const removeWatchlistPlayer = async (props: {
  clientId: string;
  playerId: number;
}): Promise<void> => {
  const { clientId, playerId } = props;
  const response = await sendWatchlistMessage({
    type: WATCHLIST_REQUEST_MESSAGE,
    method: "DELETE",
    clientId,
    playerId,
  });

  if (!response.ok) {
    throw new Error("Watchlist remove failed");
  }
};
