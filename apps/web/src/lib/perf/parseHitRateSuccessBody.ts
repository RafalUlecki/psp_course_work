import { parseJsonObject } from "./parseJsonObject";

interface HitRateJson {
  n?: number;
  playerId?: number;
  error?: string;
}

export interface HitRateSuccessBody {
  n: number;
  playerId: number;
}

export const parseHitRateSuccessBody = (
  bodyText: string,
): HitRateSuccessBody | null => {
  const parsed = parseJsonObject<HitRateJson>(bodyText);
  if (parsed === null) {
    return null;
  }
  if (typeof parsed.n !== "number" || typeof parsed.playerId !== "number") {
    return null;
  }
  return { n: parsed.n, playerId: parsed.playerId };
};