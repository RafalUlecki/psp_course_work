import type { PlayerGame } from "../gameLogs/types/playerGame";
import type { FilterGamesOptions } from "./types/filterGames";

interface GameFilters {
  opponent?: string;
  venue?: FilterGamesOptions["venue"];
}

const sortByGameDateNewestFirst = (games: PlayerGame[]): PlayerGame[] =>
  [...games].sort(
    (left, right) => right.gameDate.getTime() - left.gameDate.getTime(),
  );

const matchesFilters = (game: PlayerGame, filters: GameFilters): boolean => {
  const { opponent, venue } = filters;

  if (opponent !== undefined && game.opponent !== opponent) {
    return false;
  }
  if (venue !== undefined && game.venue !== venue) {
    return false;
  }

  return true;
};

const applyLastN = (
  games: PlayerGame[],
  lastN: number | undefined,
): PlayerGame[] => {
  if (lastN === undefined) {
    return games;
  }

  return games.slice(0, lastN);
};

export const filterGames = (
  games: PlayerGame[],
  options: FilterGamesOptions = {},
): PlayerGame[] => {
  const { lastN, opponent, venue } = options;

  const filtered = sortByGameDateNewestFirst(games).filter((game) =>
    matchesFilters(game, { opponent, venue }),
  );

  return applyLastN(filtered, lastN);
};
