import type { GameLog } from "@prisma/client";
import { prisma } from "./prisma";

export type { GameLog };
export type PlayerGameLogs = GameLog[];

type GameLogsByPlayerQuery = {
  where: { playerId: number };
  orderBy: { gameDate: "desc" };
};

export type GameLogReader = {
  gameLog: {
    findMany: (args: GameLogsByPlayerQuery) => Promise<GameLog[]>;
  };
};

/**
 * Game logs for one player, newest `game_date` first.
 * Unknown or non-integer player ids return `[]` (Prisma `findMany`, no throw).
 */
export const getGameLogsByPlayerId = async (
  playerId: number,
  db: GameLogReader = prisma,
): Promise<PlayerGameLogs> => {
  if (!Number.isInteger(playerId)) {
    return [];
  }

  return db.gameLog.findMany({
    where: { playerId },
    orderBy: { gameDate: "desc" },
  });
};
