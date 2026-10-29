import { formatLineValue } from "./resolveLineSliderBounds";

export interface HitRateCardResult {
  stat: string;
  line: number;
  hitRate: number | null;
  hits: number;
  n: number;
}

export const resolveHitRateCardSummary = (result: HitRateCardResult): string => {
  const lineText = formatLineValue(result.line);

  if (result.n === 0) {
    return `${result.stat} over ${lineText} — Not enough data`;
  }

  const percent =
    result.hitRate === null ? "—" : `${Math.round(result.hitRate * 100)}%`;

  return `${result.stat} over ${lineText} — ${percent} · ${result.hits}/${result.n}`;
};
