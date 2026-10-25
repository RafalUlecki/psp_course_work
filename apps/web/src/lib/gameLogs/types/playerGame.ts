export type GameVenue = "home" | "away";

export interface PlayerGame {
  id: number;
  gameDate: Date;
  opponent: string;
  venue: GameVenue;
  pts: number;
  reb: number;
  ast: number;
}
