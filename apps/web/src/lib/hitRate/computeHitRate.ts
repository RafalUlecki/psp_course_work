import type { GameLog } from "@prisma/client";
import { isHit } from "./isHit";
import type { ComputeHitRateResult, StatKey } from "./types/computeHitRate";

const countHits = (
  games: GameLog[],
  line: number,
  statKey: StatKey,
): number => games.filter((game) => isHit(game[statKey], line)).length;

export const computeHitRate = (
  games: GameLog[],
  line: number,
  statKey: StatKey,
): ComputeHitRateResult | null => {
  const n = games.length;

  if (n === 0) {
    return null;
  }

  const hits = countHits(games, line, statKey);

  return {
    hitRate: hits / n,
    hits,
    n,
  };
};
