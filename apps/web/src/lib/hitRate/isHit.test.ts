import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isHit } from "./isHit";

describe("isHit", () => {
  it("should return true when stat is strictly above the line", () => {
    const stat = 25;
    const line = 24.5;

    const result = isHit(stat, line);

    assert.equal(result, true);
  });

  it("should return false when stat equals the line", () => {
    const stat = 24.5;
    const line = 24.5;

    const result = isHit(stat, line);

    assert.equal(result, false);
  });

  it("should return false when stat is below the line", () => {
    const stat = 24;
    const line = 24.5;

    const result = isHit(stat, line);

    assert.equal(result, false);
  });
});
