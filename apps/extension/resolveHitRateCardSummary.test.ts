import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  type HitRateCardResult,
  resolveHitRateCardSummary,
} from "./src/components/hitRateCard/utils/resolveHitRateCardSummary";

const sampleResult = (
  overrides: Partial<HitRateCardResult> = {},
): HitRateCardResult => ({
  stat: "PTS",
  line: 24.5,
  hitRate: 0.4,
  hits: 4,
  n: 10,
  ...overrides,
});

describe("resolveHitRateCardSummary", () => {
  it("should return Not enough data when n is 0", () => {
    assert.equal(
      resolveHitRateCardSummary(sampleResult({ hitRate: null, hits: 0, n: 0 })),
      "PTS over 24.5 — Not enough data",
    );
  });

  it("should return the rounded percent when n is greater than 0", () => {
    assert.equal(
      resolveHitRateCardSummary(sampleResult()),
      "PTS over 24.5 — 40% · 4/10",
    );
  });
});
