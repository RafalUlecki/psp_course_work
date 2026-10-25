import type { GameLog } from "@prisma/client";

import type { PlayerGame } from "./playerGame";

export type PlayerGameLogs = PlayerGame[];

export type GameLogsByPlayerQuery = {
  where: { playerId: number };
  orderBy: { gameDate: "desc" };
};

export type GameLogReader = {
  gameLog: {
    findMany: (args: GameLogsByPlayerQuery) => Promise<GameLog[]>;
  };
};
