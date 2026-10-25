import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import type { PlayerGame } from "../gameLogs/types/playerGame";
import { getHitRate } from "./getHitRate";
import {
  SAMPLE_HIT_RATE_PLAYER_ID,
  sampleHitRateGames,
} from "./fixtures/sampleGames";
import {
  hitRateQueryParamNames,
  type HitRateQueryParamName,
} from "./query/hitRateQueryParam";
import {
  INVALID_LAST_N_ERROR,
  INVALID_LINE_ERROR,
  INVALID_PLAYER_ID_ERROR,
  INVALID_STAT_ERROR,
  INVALID_VENUE_ERROR,
  MISSING_LINE_ERROR,
  MISSING_PLAYER_ID_ERROR,
} from "./query/errors";

type HitRateQuery = Partial<Record<HitRateQueryParamName, string>>;

const toSearchParams = (query: HitRateQuery): URLSearchParams => {
  const params = new URLSearchParams();

  for (const key of hitRateQueryParamNames) {
    const value = query[key];

    if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
};

const requiredQuery: HitRateQuery = {
  playerId: SAMPLE_HIT_RATE_PLAYER_ID,
  stat: "PTS",
  line: "24.5",
};

const emptyShape = {
  hitRate: null,
  hits: 0,
  n: 0,
  games: [],
};

const loadFixtureGames = async (
  _playerId: number,
): Promise<PlayerGame[]> => sampleHitRateGames;

const getHitRateForTests = (query: HitRateQuery) =>
  getHitRate({ searchParams: toSearchParams(query) }, loadFixtureGames);

const emptyResultShape = (result: Awaited<ReturnType<typeof getHitRate>>) =>
  result.status === 200
    ? {
        hitRate: result.body.hitRate,
        hits: result.body.hits,
        n: result.body.n,
        games: result.body.games,
      }
    : null;

describe("getHitRate", () => {
  it("should return hitRate 0.7 when fixture player PTS lastN 10 and line 24.5 are used", async () => {
    const result = await getHitRateForTests({ ...requiredQuery, lastN: "10" });

    assert.equal(result.status === 200 ? result.body.hitRate : null, 0.7);
  });

  it("should return hits 7 when fixture player and line 24.5 are used", async () => {
    const result = await getHitRateForTests({ ...requiredQuery, lastN: "10" });

    assert.equal(result.status === 200 ? result.body.hits : null, 7);
  });

  it("should return n 10 when lastN is omitted and the loader returns more than 10 games", async () => {
    const extraOlderGames: PlayerGame[] = [
      {
        ...sampleHitRateGames[0],
        id: 11,
        gameDate: new Date("2026-03-01T00:00:00.000Z"),
        pts: 99,
      },
      {
        ...sampleHitRateGames[0],
        id: 12,
        gameDate: new Date("2026-03-02T00:00:00.000Z"),
        pts: 99,
      },
    ];
    const result = await getHitRate(
      { searchParams: toSearchParams(requiredQuery) },
      async () => [...sampleHitRateGames, ...extraOlderGames],
    );

    assert.equal(result.status === 200 ? result.body.n : null, 10);
  });

  it("should return the empty shape when the loader returns no games", async () => {
    const result = await getHitRate(
      { searchParams: toSearchParams(requiredQuery) },
      async () => [],
    );

    assert.deepEqual(emptyResultShape(result), emptyShape);
  });

  it("should return the empty shape when opponent matches no games", async () => {
    const result = await getHitRateForTests({
      ...requiredQuery,
      opponent: "ZZZ",
    });

    assert.deepEqual(emptyResultShape(result), emptyShape);
  });

  it("should call the loader with the playerId when playerId is provided", async () => {
    const loadGameLogs = mock.fn(loadFixtureGames);

    await getHitRate(
      { searchParams: toSearchParams(requiredQuery) },
      loadGameLogs,
    );

    assert.equal(
      loadGameLogs.mock.calls[0]?.arguments[0],
      Number(SAMPLE_HIT_RATE_PLAYER_ID),
    );
  });

  it("should return hitRate 1 when lastN is 5", async () => {
    const result = await getHitRateForTests({ ...requiredQuery, lastN: "5" });

    assert.equal(result.status === 200 ? result.body.hitRate : null, 1);
  });

  it("should return n 5 when lastN is 5", async () => {
    const result = await getHitRateForTests({ ...requiredQuery, lastN: "5" });

    assert.equal(result.status === 200 ? result.body.n : null, 5);
  });

  it("should return 400 when playerId is omitted", async () => {
    const result = await getHitRateForTests({ stat: "PTS", line: "24.5" });

    assert.equal(result.status, 400);
  });

  it("should return 400 when playerId is not a number", async () => {
    const result = await getHitRateForTests({
      ...requiredQuery,
      playerId: "abc",
    });

    assert.equal(result.status, 400);
  });

  it("should return Invalid playerId when playerId is not a number", async () => {
    const result = await getHitRateForTests({
      ...requiredQuery,
      playerId: "abc",
    });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_PLAYER_ID_ERROR,
    );
  });

  it("should return Missing playerId when playerId is omitted", async () => {
    const result = await getHitRateForTests({ stat: "PTS", line: "24.5" });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      MISSING_PLAYER_ID_ERROR,
    );
  });

  it("should return 400 when line is omitted", async () => {
    const result = await getHitRateForTests({
      playerId: SAMPLE_HIT_RATE_PLAYER_ID,
      stat: "PTS",
    });

    assert.equal(result.status, 400);
  });

  it("should return Missing line when line is omitted", async () => {
    const result = await getHitRateForTests({
      playerId: SAMPLE_HIT_RATE_PLAYER_ID,
      stat: "PTS",
    });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      MISSING_LINE_ERROR,
    );
  });

  it("should return invalid stat error when stat is STL", async () => {
    const result = await getHitRateForTests({ ...requiredQuery, stat: "STL" });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_STAT_ERROR,
    );
  });

  it("should return invalid line error when line is not a number", async () => {
    const result = await getHitRateForTests({ ...requiredQuery, line: "abc" });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_LINE_ERROR,
    );
  });

  it("should return invalid lastN error when lastN is zero", async () => {
    const result = await getHitRateForTests({ ...requiredQuery, lastN: "0" });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_LAST_N_ERROR,
    );
  });

  it("should return invalid lastN error when lastN is negative", async () => {
    const result = await getHitRateForTests({ ...requiredQuery, lastN: "-1" });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_LAST_N_ERROR,
    );
  });

  it("should return invalid venue error when venue is invalid", async () => {
    const result = await getHitRateForTests({
      ...requiredQuery,
      venue: "neutral",
    });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_VENUE_ERROR,
    );
  });
});
