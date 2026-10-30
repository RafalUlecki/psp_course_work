import { type ReactElement, type SyntheticEvent } from "react";

import type { TestClientId } from "../../settings/constants";
import {
  useWatchlistQuery,
  useWatchlistToggle,
} from "./requests/useWatchlistQuery";
import { isPlayerOnWatchlist } from "./utils/isPlayerOnWatchlist";
import { StarButton } from "./watchlistStyles";

interface WatchlistStarProps {
  clientId: TestClientId;
  playerId: string;
}

const stop = (event: SyntheticEvent): void => {
  event.stopPropagation();
};

export const WatchlistStar = (props: WatchlistStarProps): ReactElement => {
  const { clientId, playerId } = props;
  const query = useWatchlistQuery({ clientId });
  const toggle = useWatchlistToggle({ clientId });
  const numericPlayerId = Number(playerId);
  const watched =
    query.data === undefined
      ? false
      : isPlayerOnWatchlist({
          items: query.data.items,
          playerId: numericPlayerId,
        });

  return (
    <StarButton
      type="button"
      data-prophover-watchlist-star=""
      data-prophover-watched={watched ? "true" : "false"}
      aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
      aria-pressed={watched}
      $watched={watched}
      disabled={query.isPending || toggle.isPending}
      onClick={(event) => {
        event.preventDefault();
        stop(event);
        if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
          return;
        }
        toggle.mutate({ playerId: numericPlayerId, watched });
      }}
      onMouseDown={stop}
      onPointerDown={stop}
    >
      {watched ? "★" : "☆"}
    </StarButton>
  );
};
