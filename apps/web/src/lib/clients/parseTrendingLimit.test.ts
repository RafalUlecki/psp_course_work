import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_TRENDING_LIMIT } from "./constants";
import { INVALID_TRENDING_LIMIT_ERROR } from "./errors";
import { parseTrendingLimit } from "./parseTrendingLimit";

describe("parseTrendingLimit", () => {
  it("should default to 10 when limit is omitted", () => {
    const result = parseTrendingLimit({
      searchParams: new URLSearchParams(),
    });

    assert.deepEqual(result, { ok: true, limit: DEFAULT_TRENDING_LIMIT });
  });

  it("should return the parsed limit when it is a valid integer", () => {
    const result = parseTrendingLimit({
      searchParams: new URLSearchParams({ limit: "3" }),
    });

    assert.deepEqual(result, { ok: true, limit: 3 });
  });

  it("should return an invalid-limit error when limit is 0", () => {
    const result = parseTrendingLimit({
      searchParams: new URLSearchParams({ limit: "0" }),
    });

    assert.equal(result.ok ? null : result.error, INVALID_TRENDING_LIMIT_ERROR);
  });
});
