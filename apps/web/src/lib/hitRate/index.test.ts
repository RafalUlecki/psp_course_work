import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeHitRate, filterGames, isHit, validateStat } from "./index";

describe("hitRate barrel", () => {
  it("should export isHit, filterGames, computeHitRate, and validateStat as functions", () => {
    assert.deepEqual(
      [isHit, filterGames, computeHitRate, validateStat].map(
        (value) => typeof value,
      ),
      ["function", "function", "function", "function"],
    );
  });
});
