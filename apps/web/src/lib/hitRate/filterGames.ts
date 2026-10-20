import type { GameLog, Venue } from "@prisma/client";

export type FilterGamesOptions = {
  lastN?: number;
  opponent?: string;
  venue?: Venue;
};

/**
 * Returns a new array of game logs matching the given filters.
 *
 * Processing order (input order is not assumed; the input array is not mutated):
 * 1. Copy and sort by `gameDate` newest-first (`GameLog.gameDate`).
 * 2. Apply optional `opponent` (`GameLog.opponent`) and `venue` (`GameLog.venue`) filters.
 * 3. Take the `lastN` newest remaining games. `lastN` undefined means no limit;
 *    `lastN` larger than the remaining list returns all remaining games.
 *
 * `venue` maps 1:1 onto Prisma `Venue` (`"home" | "away"`), the same field stored
 * on `GameLog`. It is not a boolean `isHome`.
 *
 * Opponent/venue run before `lastN` so "last 5 vs SA at home" means the 5 newest
 * games that match those filters, not the 5 newest games overall then a subset.
 */
export const filterGames = (
  games: GameLog[],
  options: FilterGamesOptions = {},
): GameLog[] => {
  const { lastN, opponent, venue } = options;

  const filtered = [...games]
    .sort((left, right) => right.gameDate.getTime() - left.gameDate.getTime())
    .filter((game) => {
      if (opponent !== undefined && game.opponent !== opponent) {
        return false;
      }
      if (venue !== undefined && game.venue !== venue) {
        return false;
      }
      return true;
    });

  if (lastN === undefined) {
    return filtered;
  }

  return filtered.slice(0, lastN);
};
