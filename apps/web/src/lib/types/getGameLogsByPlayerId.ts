import type { GameLog } from "@prisma/client";

export type PlayerGameLogs = GameLog[];

export type GameLogsByPlayerQuery = {
  where: { playerId: number };
  orderBy: { gameDate: "desc" };
};

export type GameLogReader = {
  gameLog: {
    findMany: (args: GameLogsByPlayerQuery) => Promise<GameLog[]>;
  };
};
