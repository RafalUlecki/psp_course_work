export type StatKey = "pts" | "reb" | "ast";

export interface ComputeHitRateResult {
  hitRate: number;
  hits: number;
  n: number;
}
