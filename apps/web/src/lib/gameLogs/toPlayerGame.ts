import type { GameLog } from "@prisma/client";

import type { PlayerGame } from "./types/playerGame";

export const toPlayerGame = (row: GameLog): PlayerGame => ({
  id: row.id,
  gameDate: row.gameDate,
  opponent: row.opponent,
  venue: row.venue,
  pts: row.pts,
  reb: row.reb,
  ast: row.ast,
});
