import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPlayerOnWatchlist } from "./isPlayerOnWatchlist";

describe("isPlayerOnWatchlist", () => {
  it("should return true when the player id is in the watchlist", () => {
    assert.equal(
      isPlayerOnWatchlist({
        items: [{ playerId: 203999 }, { playerId: 1629029 }],
        playerId: 203999,
      }),
      true,
    );
  });

  it("should return false when the player id is not in the watchlist", () => {
    assert.equal(
      isPlayerOnWatchlist({
        items: [{ playerId: 1629029 }],
        playerId: 203999,
      }),
      false,
    );
  });
});
