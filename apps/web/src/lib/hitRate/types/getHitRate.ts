import type { PlayerGame } from "../../gameLogs/types/playerGame";

export type GameLogLoader = (playerId: number) => Promise<PlayerGame[]>;

export interface GetHitRateProps {
  searchParams: URLSearchParams;
}
