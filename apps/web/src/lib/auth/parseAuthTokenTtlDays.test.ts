import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_AUTH_TOKEN_TTL_DAYS } from "./constants";
import { INVALID_AUTH_TOKEN_TTL_DAYS_ERROR } from "./errors";
import { parseAuthTokenTtlDays } from "./parseAuthTokenTtlDays";

describe("parseAuthTokenTtlDays", () => {
  it("should fall back to 14 when AUTH_TOKEN_TTL_DAYS is missing", () => {
    const result = parseAuthTokenTtlDays({ raw: undefined });

    assert.deepEqual(result, { ok: true, days: DEFAULT_AUTH_TOKEN_TTL_DAYS });
  });

  it("should return 7 when AUTH_TOKEN_TTL_DAYS is 7", () => {
    const result = parseAuthTokenTtlDays({ raw: "7" });

    assert.deepEqual(result, { ok: true, days: 7 });
  });

  it("should fail when AUTH_TOKEN_TTL_DAYS is not a number", () => {
    const result = parseAuthTokenTtlDays({ raw: "abc" });

    assert.deepEqual(result, {
      ok: false,
      error: INVALID_AUTH_TOKEN_TTL_DAYS_ERROR,
    });
  });

  it("should fail when AUTH_TOKEN_TTL_DAYS is less than 1", () => {
    const result = parseAuthTokenTtlDays({ raw: "0" });

    assert.deepEqual(result, {
      ok: false,
      error: INVALID_AUTH_TOKEN_TTL_DAYS_ERROR,
    });
  });
});
