import type {
  GameLogReader,
  PlayerGameLogs,
} from "./types/getGameLogsByPlayerId";
import { prisma } from "../prisma";

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
