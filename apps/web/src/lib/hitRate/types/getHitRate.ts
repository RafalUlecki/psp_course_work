import type { GameLog } from "@prisma/client";

export type GameLogLoader = (playerId: number) => Promise<GameLog[]>;

export interface GetHitRateProps {
  searchParams: URLSearchParams;
}
