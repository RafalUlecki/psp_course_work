import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SAMPLE_HIT_RATE_PLAYER_ID,
  sampleHitRateGames,
} from "./fixtures/sampleGames";
import { getHitRate } from "./getHitRate";
import { handleHitRateRequest } from "./handleHitRateRequest";
import type { GameLogLoader } from "./types/getHitRate";

const requiredParams = new URLSearchParams({
  playerId: SAMPLE_HIT_RATE_PLAYER_ID,
  stat: "PTS",
  line: "24.5",
  lastN: "10",
});

const loadFixtureGames: GameLogLoader = async () => sampleHitRateGames;

describe("handleHitRateRequest", () => {
  it("should return the same body as getHitRate", async () => {
    const handled = await handleHitRateRequest(
      { searchParams: requiredParams },
      loadFixtureGames,
    );
    const direct = await getHitRate(
      { searchParams: requiredParams },
      loadFixtureGames,
    );

    assert.deepEqual(handled, direct);
  });
});
