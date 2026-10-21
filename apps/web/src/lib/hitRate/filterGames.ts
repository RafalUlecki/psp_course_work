import type { GameLog } from "@prisma/client";
import type { FilterGamesOptions } from "./types/filterGames";

interface GameLogFilters {
  opponent?: string;
  venue?: FilterGamesOptions["venue"];
}

const sortByGameDateNewestFirst = (games: GameLog[]): GameLog[] =>
  [...games].sort(
    (left, right) => right.gameDate.getTime() - left.gameDate.getTime(),
  );

const matchesFilters = (game: GameLog, filters: GameLogFilters): boolean => {
  const { opponent, venue } = filters;

  if (opponent !== undefined && game.opponent !== opponent) {
    return false;
  }
  if (venue !== undefined && game.venue !== venue) {
    return false;
  }

  return true;
};

const applyLastN = (games: GameLog[], lastN: number | undefined): GameLog[] => {
  if (lastN === undefined) {
    return games;
  }

  return games.slice(0, lastN);
};

export const filterGames = (
  games: GameLog[],
  options: FilterGamesOptions = {},
): GameLog[] => {
  const { lastN, opponent, venue } = options;

  const filtered = sortByGameDateNewestFirst(games).filter((game) =>
    matchesFilters(game, { opponent, venue }),
  );

  return applyLastN(filtered, lastN);
};
