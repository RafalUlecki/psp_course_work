import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PlayerGame } from "../gameLogs/types/playerGame";
import { computeHitRate } from "./computeHitRate";

interface PlayerGameFixtureInput {
  id: number;
  pts?: number;
  reb?: number;
  ast?: number;
}

const buildPlayerGame = (input: PlayerGameFixtureInput): PlayerGame => ({
  id: input.id,
  gameDate: new Date("2026-04-01T00:00:00.000Z"),
  opponent: "SA",
  venue: "home",
  pts: input.pts ?? 20,
  reb: input.reb ?? 10,
  ast: input.ast ?? 8,
});

const gamesWithPts = (ptsValues: number[]): PlayerGame[] =>
  ptsValues.map((pts, index) => buildPlayerGame({ id: index + 1, pts }));

describe("computeHitRate", () => {
  it("should return hitRate 0.7, hits 7, and n 10 when 7 of 10 games are hits", () => {
    const games = gamesWithPts([30, 28, 27, 26, 25, 25, 25, 24, 20, 10]);

    const result = computeHitRate(games, 24.5, "pts");

    assert.deepEqual(result, { hitRate: 0.7, hits: 7, n: 10 });
  });

  it("should return null when games is empty", () => {
    const result = computeHitRate([], 24.5, "pts");

    assert.equal(result, null);
  });

  it("should return hitRate 0 and hits 0 when every game is a miss", () => {
    const games = gamesWithPts([20, 18, 10]);

    const result = computeHitRate(games, 24.5, "pts");

    assert.deepEqual(result, { hitRate: 0, hits: 0, n: 3 });
  });
});
