import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { measureHitRate } from "./measureHitRate";
import type { PerfFetch } from "./types/fetchLike";

const hitRateFetch = (clock: { now: number }): PerfFetch => async () => {
  clock.now += 5;
  return {
    status: 200,
    text: async () => JSON.stringify({ playerId: 203999, n: 65 }),
  };
};

describe("measureHitRate", () => {
  it("should exclude warmup samples from the result", async () => {
    const clock = { now: 0 };
    const result = await measureHitRate({
      baseUrl: "http://localhost:3000",
      measuredCount: 3,
      warmupCount: 2,
      token: "t",
      fetchImpl: hitRateFetch(clock),
      nowMs: () => clock.now,
    });
    assert.equal(result.ok ? result.samplesMs.length : 0, 3);
  });

  it("should record the player game count from the large lastN request", async () => {
    const clock = { now: 0 };
    const result = await measureHitRate({
      baseUrl: "http://localhost:3000",
      measuredCount: 1,
      warmupCount: 0,
      token: null,
      fetchImpl: hitRateFetch(clock),
      nowMs: () => clock.now,
    });
    assert.equal(result.ok ? result.playerGameCount : null, 65);
  });
});
