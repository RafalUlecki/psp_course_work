import type { GameVenue } from "../../gameLogs/types/playerGame";

export interface FilterGamesOptions {
  lastN?: number;
  opponent?: string;
  venue?: GameVenue;
}
