import type { WatchlistItemDto } from "../../../lib/genericProp/types/watchlistMessage";

export const isPlayerOnWatchlist = (props: {
  items: WatchlistItemDto[];
  playerId: number;
}): boolean => {
  const { items, playerId } = props;
  return items.some((item) => item.playerId === playerId);
};
