import type { GameVenue } from "../../gameLogs/types/playerGame";

export interface PlayerStatisticsRow {
  personId: number;
  playerName: string;
  team: string;
  opponent: string;
  venue: GameVenue;
  gameDate: Date;
  gameId: string;
  points: number;
  reboundsTotal: number;
  assists: number;
}
