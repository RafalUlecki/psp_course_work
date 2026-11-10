import type { WatchlistPlayerCount } from "../watchlist/types/watchlistStore";

interface RankTrendingPlayersProps {
  rows: readonly WatchlistPlayerCount[];
  limit: number;
}

export const rankTrendingPlayers = (
  props: RankTrendingPlayersProps,
): WatchlistPlayerCount[] => {
  const { rows, limit } = props;

  return [...rows]
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.playerId - right.playerId;
    })
    .slice(0, limit);
};
