import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickWatchlistPlayers } from "./pickWatchlistPlayers";

describe("pickWatchlistPlayers", () => {
  it("should return Jokic and Luka ids when both preferred players are present", () => {
    const ids = pickWatchlistPlayers({
      players: [
        { id: 1, name: "Austin Reaves" },
        { id: 203999, name: "Nikola Jokic" },
        { id: 1629029, name: "Luka Doncic" },
      ],
    });

    assert.deepEqual(ids, {
      clientAPlayerId: 203999,
      clientBPlayerId: 1629029,
    });
  });

  it("should return the first two player ids when preferred names are missing", () => {
    const ids = pickWatchlistPlayers({
      players: [
        { id: 1630559, name: "Austin Reaves" },
        { id: 1628369, name: "Jayson Tatum" },
      ],
    });

    assert.deepEqual(ids, {
      clientAPlayerId: 1630559,
      clientBPlayerId: 1628369,
    });
  });
});
