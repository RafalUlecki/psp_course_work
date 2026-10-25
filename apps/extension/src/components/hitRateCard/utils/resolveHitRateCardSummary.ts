export interface HitRateCardResult {
  stat: string;
  line: number;
  hitRate: number | null;
  hits: number;
  n: number;
}

export const resolveHitRateCardSummary = (result: HitRateCardResult): string => {
  if (result.n === 0) {
    return `${result.stat} over ${result.line} — Not enough data`;
  }

  const percent =
    result.hitRate === null ? "—" : `${Math.round(result.hitRate * 100)}%`;

  return `${result.stat} over ${result.line} — ${percent} · ${result.hits}/${result.n}`;
};
