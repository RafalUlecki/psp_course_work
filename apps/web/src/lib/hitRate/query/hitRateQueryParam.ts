export enum HitRateQueryParam {
  playerId = "playerId",
  stat = "stat",
  line = "line",
  lastN = "lastN",
  opponent = "opponent",
  venue = "venue",
}

export type HitRateQueryParamName = `${HitRateQueryParam}`;

export interface NormalizedHitRateQuery {
  playerId?: string;
  stat?: string;
  line?: string;
  lastN?: string;
  opponent?: string;
  venue?: string;
}

export const hitRateQueryParamNames: HitRateQueryParamName[] =
  Object.values(HitRateQueryParam);
