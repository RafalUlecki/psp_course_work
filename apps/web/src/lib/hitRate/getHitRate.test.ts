import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getHitRate } from "./getHitRate";
import { SAMPLE_HIT_RATE_PLAYER_ID } from "./fixtures/sampleGames";
import {
  hitRateQueryParamNames,
  type HitRateQueryParamName,
} from "./query/hitRateQueryParam";
import {
  INVALID_LAST_N_ERROR,
  INVALID_LINE_ERROR,
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

describe("getHitRate", () => {
  it("should return hitRate 0.7 when fixture player and line 24.5 are used", () => {
    const result = getHitRate({ searchParams: toSearchParams(requiredQuery) });

    assert.equal(result.status === 200 ? result.body.hitRate : null, 0.7);
  });

  it("should return hits 7 when fixture player and line 24.5 are used", () => {
    const result = getHitRate({ searchParams: toSearchParams(requiredQuery) });

    assert.equal(result.status === 200 ? result.body.hits : null, 7);
  });

  it("should return n 10 when fixture player and line 24.5 are used", () => {
    const result = getHitRate({ searchParams: toSearchParams(requiredQuery) });

    assert.equal(result.status === 200 ? result.body.n : null, 10);
  });

  it("should return ten games when fixture player and line 24.5 are used", () => {
    const result = getHitRate({ searchParams: toSearchParams(requiredQuery) });

    assert.equal(result.status === 200 ? result.body.games.length : null, 10);
  });

  it("should return hitRate 1 when lastN is 5", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, lastN: "5" }),
    });

    assert.equal(result.status === 200 ? result.body.hitRate : null, 1);
  });

  it("should return n 5 when lastN is 5", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, lastN: "5" }),
    });

    assert.equal(result.status === 200 ? result.body.n : null, 5);
  });

  it("should return null hitRate when filters match no fixture games", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, opponent: "ZZZ" }),
    });

    assert.equal(result.status === 200 ? result.body.hitRate : null, null);
  });

  it("should return empty games when filters match no fixture games", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, opponent: "ZZZ" }),
    });

    assert.deepEqual(result.status === 200 ? result.body.games : null, []);
  });

  it("should return null hitRate when playerId is not the fixture player", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, playerId: "999" }),
    });

    assert.equal(result.status === 200 ? result.body.hitRate : null, null);
  });

  it("should return empty games when playerId is not the fixture player", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, playerId: "999" }),
    });

    assert.deepEqual(result.status === 200 ? result.body.games : null, []);
  });

  it("should return 400 when playerId is omitted", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ stat: "PTS", line: "24.5" }),
    });

    assert.equal(result.status, 400);
  });

  it("should return Missing playerId when playerId is omitted", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ stat: "PTS", line: "24.5" }),
    });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      MISSING_PLAYER_ID_ERROR,
    );
  });

  it("should return 400 when line is omitted", () => {
    const result = getHitRate({
      searchParams: toSearchParams({
        playerId: SAMPLE_HIT_RATE_PLAYER_ID,
        stat: "PTS",
      }),
    });

    assert.equal(result.status, 400);
  });

  it("should return Missing line when line is omitted", () => {
    const result = getHitRate({
      searchParams: toSearchParams({
        playerId: SAMPLE_HIT_RATE_PLAYER_ID,
        stat: "PTS",
      }),
    });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      MISSING_LINE_ERROR,
    );
  });

  it("should return invalid stat error when stat is STL", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, stat: "STL" }),
    });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_STAT_ERROR,
    );
  });

  it("should return invalid line error when line is not a number", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, line: "abc" }),
    });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_LINE_ERROR,
    );
  });

  it("should return invalid lastN error when lastN is zero", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, lastN: "0" }),
    });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_LAST_N_ERROR,
    );
  });

  it("should return invalid venue error when venue is invalid", () => {
    const result = getHitRate({
      searchParams: toSearchParams({ ...requiredQuery, venue: "neutral" }),
    });

    assert.equal(
      result.status === 400 ? result.body.error : null,
      INVALID_VENUE_ERROR,
    );
  });
});
