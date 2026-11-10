import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rankTrendingPlayers } from "./rankTrendingPlayers";

describe("rankTrendingPlayers", () => {
  it("should sort equal counts by playerId ascending", () => {
    const result = rankTrendingPlayers({
      rows: [
        { playerId: 20, count: 1 },
        { playerId: 10, count: 1 },
      ],
      limit: 10,
    });

    assert.deepEqual(result, [
      { playerId: 10, count: 1 },
      { playerId: 20, count: 1 },
    ]);
  });
});
