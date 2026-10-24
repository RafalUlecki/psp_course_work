import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

interface LatestRequestGuard {
  begin: () => number;
  invalidate: () => void;
  isCurrent: (id: number) => boolean;
}

interface HitRateCardResultInput {
  status: "result";
  stat: string;
  line: number;
  hitRate: number | null;
  hits: number;
  n: number;
}

type HitRateCardSummaryInput =
  | { status: "loading" }
  | { status: "error" }
  | HitRateCardResultInput;

type HitRateCardViewStatus = "loading" | "data" | "empty" | "error";

interface HitRateCardStateModule {
  HIT_RATE_CARD_LOADING_TEXT: string;
  HIT_RATE_CARD_ERROR_TEXT: string;
  createLatestRequestGuard: () => LatestRequestGuard;
  resolveHitRateCardStatus: (
    input: HitRateCardSummaryInput,
  ) => HitRateCardViewStatus;
  resolveHitRateCardSummary: (input: HitRateCardSummaryInput) => string;
}

const require = createRequire(import.meta.url);

const loadHitRateCardState = (): HitRateCardStateModule => {
  const extensionDir = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../extension",
  );
  const loaded: HitRateCardStateModule = require(
    join(extensionDir, "hitRateCardState.js"),
  );
  return loaded;
};

const hitRateCardState = loadHitRateCardState();

const sampleResult = (
  overrides: Partial<HitRateCardResultInput> = {},
): HitRateCardResultInput => ({
  status: "result",
  stat: "PTS",
  line: 24.5,
  hitRate: 0.4,
  hits: 4,
  n: 10,
  ...overrides,
});

describe("resolveHitRateCardSummary", () => {
  it("should return Loading… when status is loading", () => {
    assert.equal(
      hitRateCardState.resolveHitRateCardSummary({ status: "loading" }),
      "Loading…",
    );
  });

  it("should return error when status is error", () => {
    assert.equal(
      hitRateCardState.resolveHitRateCardSummary({ status: "error" }),
      "error",
    );
  });

  it("should return Not enough data when n is 0", () => {
    assert.equal(
      hitRateCardState.resolveHitRateCardSummary(
        sampleResult({ hitRate: null, hits: 0, n: 0 }),
      ),
      "PTS over 24.5 — Not enough data",
    );
  });

  it("should return the rounded percent when n is greater than 0", () => {
    assert.equal(
      hitRateCardState.resolveHitRateCardSummary(sampleResult()),
      "PTS over 24.5 — 40% · 4/10",
    );
  });
});

describe("resolveHitRateCardStatus", () => {
  it("should return empty when n is 0", () => {
    assert.equal(
      hitRateCardState.resolveHitRateCardStatus(
        sampleResult({ hitRate: null, hits: 0, n: 0 }),
      ),
      "empty",
    );
  });
});

describe("createLatestRequestGuard", () => {
  it("should not treat a previous request as current after a newer request begins", () => {
    const guard = hitRateCardState.createLatestRequestGuard();
    const previous = guard.begin();
    guard.begin();

    assert.equal(guard.isCurrent(previous), false);
  });

  it("should not treat a previous request as current after invalidate", () => {
    const guard = hitRateCardState.createLatestRequestGuard();
    const previous = guard.begin();
    guard.invalidate();

    assert.equal(guard.isCurrent(previous), false);
  });
});
