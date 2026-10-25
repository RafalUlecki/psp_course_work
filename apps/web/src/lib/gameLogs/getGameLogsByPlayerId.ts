import { prisma } from "../prisma";
import { toPlayerGame } from "./toPlayerGame";
import type {
  GameLogReader,
  PlayerGameLogs,
} from "./types/getGameLogsByPlayerId";

export const getGameLogsByPlayerId = async (
  playerId: number,
  db: GameLogReader = prisma,
): Promise<PlayerGameLogs> => {
  if (!Number.isInteger(playerId)) {
    return [];
  }

  const rows = await db.gameLog.findMany({
    where: { playerId },
    orderBy: { gameDate: "desc" },
  });

  return rows.map(toPlayerGame);
};
