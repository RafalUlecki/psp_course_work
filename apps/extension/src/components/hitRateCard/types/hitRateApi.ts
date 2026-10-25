export interface HitRateSuccessResponse {
  playerId: number;
  stat: string;
  line: number;
  hitRate: number | null;
  hits: number;
  n: number;
}
