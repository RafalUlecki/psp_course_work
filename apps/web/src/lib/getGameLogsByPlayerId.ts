import type { GameLog } from "@prisma/client";
import { prisma } from "./prisma";

export type { GameLog };
export type PlayerGameLogs = GameLog[];

/**
 * Game logs for one player, newest `game_date` first.
 * Unknown or non-integer player ids return `[]` (Prisma `findMany`, no throw).
 */
export const getGameLogsByPlayerId = async (
  playerId: number,
): Promise<PlayerGameLogs> => {
  if (!Number.isInteger(playerId)) {
    return [];
  }

  return prisma.gameLog.findMany({
    where: { playerId },
    orderBy: { gameDate: "desc" },
  });
};
