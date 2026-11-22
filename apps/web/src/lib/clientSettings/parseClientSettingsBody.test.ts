import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  INVALID_DEFAULT_LAST_N_ERROR,
  INVALID_JSON_BODY_ERROR,
  MISSING_DEFAULT_LAST_N_ERROR,
} from "./errors";
import { parseClientSettingsBody } from "./parseClientSettingsBody";

describe("parseClientSettingsBody", () => {
  it("should return 5 when defaultLastN is 5", () => {
    const result = parseClientSettingsBody({
      bodyText: JSON.stringify({ defaultLastN: 5 }),
    });

    assert.equal(result.ok ? result.defaultLastN : null, 5);
  });

  it("should return 10 when defaultLastN is 10", () => {
    const result = parseClientSettingsBody({
      bodyText: JSON.stringify({ defaultLastN: 10 }),
    });

    assert.equal(result.ok ? result.defaultLastN : null, 10);
  });

  it("should return 5 when the body also includes clientId", () => {
    const result = parseClientSettingsBody({
      bodyText: JSON.stringify({ clientId: "B", defaultLastN: 5 }),
    });

    assert.equal(result.ok ? result.defaultLastN : null, 5);
  });

  it("should return a missing-defaultLastN error when the body is empty", () => {
    const result = parseClientSettingsBody({ bodyText: "  " });

    assert.equal(
      result.ok ? null : result.error,
      MISSING_DEFAULT_LAST_N_ERROR,
    );
  });

  it("should return a missing-defaultLastN error when defaultLastN is omitted", () => {
    const result = parseClientSettingsBody({
      bodyText: JSON.stringify({ clientId: "A" }),
    });

    assert.equal(
      result.ok ? null : result.error,
      MISSING_DEFAULT_LAST_N_ERROR,
    );
  });

  it("should return an invalid-JSON error when the body is not JSON", () => {
    const result = parseClientSettingsBody({ bodyText: "not-json" });

    assert.equal(result.ok ? null : result.error, INVALID_JSON_BODY_ERROR);
  });

  it("should return an invalid-defaultLastN error when defaultLastN is 7", () => {
    const result = parseClientSettingsBody({
      bodyText: JSON.stringify({ defaultLastN: 7 }),
    });

    assert.equal(
      result.ok ? null : result.error,
      INVALID_DEFAULT_LAST_N_ERROR,
    );
  });
});
