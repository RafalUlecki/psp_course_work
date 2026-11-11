import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  INVALID_WATCHLIST_ITEM_ID_ERROR,
  MISSING_WATCHLIST_ITEM_ID_ERROR,
} from "../errors";
import { parseWatchlistItemIdQuery } from "./parseWatchlistItemId";

describe("parseWatchlistItemIdQuery", () => {
  it("should return the id when id is a positive integer", () => {
    const result = parseWatchlistItemIdQuery({
      searchParams: new URLSearchParams({ id: "2" }),
    });

    assert.equal(result.ok ? result.id : null, 2);
  });

  it("should return a missing-id error when id is omitted", () => {
    const result = parseWatchlistItemIdQuery({
      searchParams: new URLSearchParams(),
    });

    assert.equal(
      result.ok ? null : result.error,
      MISSING_WATCHLIST_ITEM_ID_ERROR,
    );
  });

  it("should return an invalid-id error when id is not a number", () => {
    const result = parseWatchlistItemIdQuery({
      searchParams: new URLSearchParams({ id: "abc" }),
    });

    assert.equal(
      result.ok ? null : result.error,
      INVALID_WATCHLIST_ITEM_ID_ERROR,
    );
  });
});
