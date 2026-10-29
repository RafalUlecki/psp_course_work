import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  INVALID_JSON_BODY_ERROR,
  MISSING_PLAYER_ID_ERROR,
} from "../errors";
import {
  parseWatchlistPlayerIdBody,
  parseWatchlistPlayerIdQuery,
} from "./parseWatchlistPlayerId";

describe("parseWatchlistPlayerIdBody", () => {
  it("should return the player id when the JSON body is valid", () => {
    const result = parseWatchlistPlayerIdBody({
      bodyText: JSON.stringify({ playerId: 203999 }),
    });

    assert.equal(result.ok ? result.playerId : null, 203999);
  });

  it("should return a missing-playerId error when the body is empty", () => {
    const result = parseWatchlistPlayerIdBody({ bodyText: "  " });

    assert.equal(result.ok ? null : result.error, MISSING_PLAYER_ID_ERROR);
  });

  it("should return an invalid-JSON error when the body is not JSON", () => {
    const result = parseWatchlistPlayerIdBody({ bodyText: "not-json" });

    assert.equal(result.ok ? null : result.error, INVALID_JSON_BODY_ERROR);
  });
});

describe("parseWatchlistPlayerIdQuery", () => {
  it("should return the player id when playerId is a positive integer", () => {
    const result = parseWatchlistPlayerIdQuery({
      searchParams: new URLSearchParams({ playerId: "203999" }),
    });

    assert.equal(result.ok ? result.playerId : null, 203999);
  });

  it("should return a missing-playerId error when playerId is omitted", () => {
    const result = parseWatchlistPlayerIdQuery({
      searchParams: new URLSearchParams(),
    });

    assert.equal(result.ok ? null : result.error, MISSING_PLAYER_ID_ERROR);
  });
});
